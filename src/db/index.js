import mongoose from "mongoose";
// import { DB_NAME } from "../constants.js";


const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`mongodb+srv://deciders07:Deciders%40cs2@cluster0.ccqsv.mongodb.net/Library`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)     //note: or we can redirect user to Server is not responding webpage
    }
}

export default connectDB