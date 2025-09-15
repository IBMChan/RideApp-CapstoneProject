import mongoose from "mongoose";
import { config as configDotenv } from "dotenv";
configDotenv();

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/ibm_rideapp_capstone_db";
  await mongoose.connect(uri);
};