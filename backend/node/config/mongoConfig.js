// mongoConfig.js
import mongoose from "mongoose";
import env from "./envConfig.js";

export const connectMongoDB = async () => {
  try {
    await mongoose.connect(env.mongo.uri, { dbName: env.mongo.dbName });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
