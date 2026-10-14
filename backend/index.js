import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";


dns.setServers(["1.1.1.1","8.8.8.8"]);

dotenv.config();

//console.log(process.env.MONGODB_URI);


const connectDB = async ()=>{
    try{
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log("Database connected!");
    }catch(error){
        console.log("Connection failed!", error.message);
        process.exit(1);
    }
}

connectDB();