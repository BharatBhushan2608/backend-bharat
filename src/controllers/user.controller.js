import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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

 
})

export {registerUser};
