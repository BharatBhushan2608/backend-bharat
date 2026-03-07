// require('dotenv').config({path : './env'}); // old way of importing dotenv
//import dotenv from "dotenv"; // new way of importing dotenv

import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import {app} from "./app.js";


import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
// Ensure Node uses reliable public DNS for SRV lookups (workaround for local DNS stub issues)
dns.setServers(["8.8.8.8", "8.8.4.4"]);




// dotenv.config({
//     path : "./.env"
// });

connectDB()

.then( () => {
    app.on( "error" ,(error) =>{
        console.log("ERRRR:" , error);
        throw error;
    })
    app.listen(process.env.PORT || 8000 , ()=> {
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch( (err) => {
    console.log("MONGo DB connection failed" , err)
})

console.log("PORT:", process.env.PORT);
console.log("CLOUD:", process.env.CLOUDINARY_CLOUD_NAME);

// running from the root directory of the project, so it can access .env file and other files in the project
console.log("RUNNING FROM:", process.cwd());
 




/*
import express from "express";
const app = express();
;( async () => {
    try {
         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

         app.on("error" , (error) => {
            console.log("ERR:" , error);
            throw error;
         })

         app.listen(process.env.PORT , () => {
            console.log(`App is listening on port ${process.env.PORT}`);
         })
        
    } catch (error) {
        console.log("Error in DB connection", error);
        
    }
})()
*/