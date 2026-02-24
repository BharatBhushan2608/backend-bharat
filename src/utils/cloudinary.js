import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

import dotenv from "dotenv";

dotenv.config();


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });


    const uploadOnCloudinary = async (localFilePath) =>{
        try {
            if(!localFilePath) return null;
            // Upload file to Cloudinary
            const response = await cloudinary.uploader.upload(localFilePath , {
                resource_type : "auto", // this will automatically detect the file type (image, video, etc.)
            })

            //file has been uploaded suuccessfully on cloudinary
            //console.log("file has been uploaded suuccessfully on cloudinary" , response.url);
            fs.unlinkSync(localFilePath) // remove the local file after uploading to cloudinary
            return response;
            
        } catch (error) {
            fs.unlinkSync(localFilePath) // remove the local file in case of an error
            return null;
        }
    }
 
    export  {uploadOnCloudinary};