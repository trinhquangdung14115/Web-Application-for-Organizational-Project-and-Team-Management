// backend/src/config/db.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI;

export async function connectDB() {
  try {
    await mongoose.connect(uri, {
      // these are fine for Atlas
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}
