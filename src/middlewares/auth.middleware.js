import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
 
   
export const verifyJWT = asyncHandler(async(req , _ , next) => {  
    // res yha use nhi karenge kyuki ye middleware hai aur iska kaam sirf request ko verify karna hai aur aage badhna hai , agar token valid hoga to next() call hoga aur agar token invalid hoga to error throw hoga
    // res k jgh _ (underscore) use kiya hai kyuki hum res ko use nhi karenge aur eslint me error aata hai unused variable ka to usko avoid karne ke liye _ use kiya hai
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "");
    
        if(!token) {
            throw new ApiError(401 , "Unauthorized Request");
        }
    
        const  decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user) {
            // TODO: discuss about frontend
            throw new ApiError(401 , "Invalid Access Token");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid Access Token");
    }
}) 