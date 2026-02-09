import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n Connected to MongoDB database !! DB HOST:${connectionInstance.connection.host} \n`);
        
    } catch (error) {
        console.log("MONGODB connection ERROR", error);
        process.exit(1);
        
    }
}

export default connectDB; 