import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";



const generateAccessAndRefreshToken = async (userId) => {
    //
    try {
        // find the user by id from database
        const user = await User.findById(userId); 
        // generation both token and store in variables
        const accessToken = user.generateAccessToken(); // ye method user model me banaya hai isiliye small "u" hai user.generateAccessToken()
        const refreshToken = user.generateRefreshToken(); // ye method user model me banaya hai isiliye small "u" hai user.generateRefreshToken()
        
        // store refresh token in database
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false}); // validateBeforeSave : false isiliye lagaya hai kyuki hume user document ko save karna hai bina kisi validation ke kyuki hum sirf refresh token ko update kar rahe hai user document me
        
        return { accessToken , refreshToken };


    } catch (error) {
        throw new ApiError(500 , "something went wrong while generating access token and refresh token");
    }
}

const registerUser = asyncHandler( async (req , res) =>{
    // get user details from frontend
    // validation -  check not empty
    // check if user already exists: username and eamil
    // check for images , check for avatar
    // upload images to cloudinary and check avatar is uploaded successfully or not
    // create user object - create entry in database
    // remove password and refresh token field from response
    // check for user creation
    // return response 
    // if data is coming in from of json or form data we can access it by using req.body


    // get user details from frontend
    const {username , email , fullName , password} = req.body;
    console.log("EMAIL: " , email);

    // validation -  check not empty
    if (
        [fullName, username , email, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400 ,"All fields are required and must not be empty");
    }

        // check if user already exists: username and eamil

        const existedUser = await  User.findOne({
            $or : [ { username } , { email }] 
        }) 

        if (existedUser) {
            throw new ApiError( 409 , "User already exists with this username or email");
        }

        const avatarLocalPath = req.files?.avatar[0]?.path;
        //const coverImageLocalPath = req.files?.coverImage[0]?.path;

        let coverImageLocalPath ;
        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
            coverImageLocalPath = req.files.coverImage[0].path;
        }

        
        if(!avatarLocalPath){
            throw new ApiError(400 , "Avatar is required");
        }


        // upload images to cloudinary and check avatar is uploaded successfully or not
        const avatar = await uploadOnCloudinary(avatarLocalPath); // await isiliye lagaya hai kyuki hume ye ensure karna hai ki image cloudinary pe upload ho jaye uske baad hi aage ka code execute ho
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

         

        if(!avatar){
            throw new ApiError(500 , "Failed to upload avatar on cloudinary");
        }

        //console.log("FILES:", req.files);
        //console.log("AVATAR PATH:", avatarLocalPath);

        // create user object - create entry in database
        const user = await User.create({ 
            fullName ,
            avatar : avatar.url,
            coverImage : coverImage?.url || "",
            username: username.toLowerCase(),
            email,
            password

        }) 

        // remove password and refresh token field from response
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken "
        ) 

        // check for user creation
        if(!createdUser){
            throw new ApiError(500 , "Something went wrong while registering the user");
        }


        return res.status(201).json(
            new ApiResponse(201 , createdUser ,  "User registered successfully" )
        )

 
});


const loginUser = asyncHandler(async (req , res ) => {
    // To-do list for login user controller
    // get email and password from req.body
    // validate that email and password are not empty
    // find user by email from database
    // if user not found throw error
    // if user found then compare password using bcrypt.compare()
    // if password is incorrect throw error
    // if password is correct then generate access token using jwt.sign()
    // return response with access token and user details except password and refresh token


    // req body -> data le aao
    // username or email
    // find the user
    // password check
    // generate access token or refresh token
    // send cokkies


    const {username , email , password} = req.body;
    console.log("EMAIL: " , email);
    console.log("USERNAME: " , username);

    if( !email && !username){
        throw new ApiError(400 , "Username or email are required");
    } 

    const user = await User.findOne({
        $or: [{ username } , { email }]
    })

    if(!user){
        throw new ApiError(404 , "User doest not eixst");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);// ye method user model me banaya hai isiliye small "u" hai user.isPasswordCorrect()


    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid user credentials");
    }


    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id); // ye function isiliye banaya hai kyuki hume access token aur refresh token dono generate karna hai login hone ke baad

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options ={
        httpOnly : true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options) 
    .json(
        new ApiResponse(
            200 , 
            {user : loggedInUser , accessToken , refreshToken},
             "User logged in successfully")
    )

});

const logoutUser= asyncHandler(async (req , res) => {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set : { 
                    refreshToken : undefined
                 }
            },
            {
                new : true
            }
        )


        const options ={
        httpOnly : true,
        secure: true
    }

        return res
        .status(200)
        .clearCookie("accessToken" , options)
        .clearCookie("refreshToken" , options)
        .json(new ApiResponse(200 , {} , "User logged out successfully"))
})



// what steps we do when we want to refresh access token using refresh token

/* 
1 Verify refresh token
2 Decode user id
3 Find user in DB
4 Compare stored refresh token
5 Generate new tokens
6 Send new tokens 
*/

const refreshAccessToken = asyncHandler(async (req , res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(400 , "unauthorized request") 
    }

    // verify the incoming refresh token with the secret key and get the decoded token which contains the user id using jwt.verify() method
       try {
         const decodedToken = jwt.verify(
             incomingRefreshToken,
             process.env.REFRESH_TOEKN_SECRET
         )
 
     // find the user by id from database 
     // if u r calling anything from database then always use await because databas is in another continent
     const user = await User.findById(decodedToken?._id)
 
     if (!user){
         throw new ApiError(404 , "INVALID refrsh Token");
     }
 
     if (incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401 , "Refresh token is expried or used");
     }
 
     const options = {
         httpOnly : true,
         secure : true
     }
 
     const {accessToken , newRefreshToken} = await generateAccessAndRefreshToken(user._id)
 
     return res
     .status(200)
     .cookie("accessToken" , accessToken , options)
     .cookie("refreshToken" , newRefreshToken , options)
     .json(
         new ApiResponse(
             200,
             { accessToken , refreshToken : newRefreshToken },
             "Access token refreshed successfully"
         )
     )
       } catch (error) {
         throw new ApiError(401 , error?.message || "Invalid refresh token");
       }
}) 


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
};
