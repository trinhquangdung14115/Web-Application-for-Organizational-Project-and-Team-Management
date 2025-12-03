// backend/src/config/db.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI;

export async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    await mongoose.connect(uri, {
      // these are fine for Atlas
    });
    console.log("MongoDB connected");
    console.log(`Using Database: "${conn.connection.name}"`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}
