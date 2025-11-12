import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/user.model.js";
import bcrypt from "bcryptjs";

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding users");

    // Xóa users cũ
    await User.deleteMany({});

    // Hash passwords
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("123456", saltRounds);

    const users = [
      {
        name: "Super Admin",
        email: "admin@taskflow.com",
        password: hashedPassword,
        role: "Admin",
        status: "ACTIVE"
      },
      {
        name: "Project Manager 1",
        email: "manager1@taskflow.com", 
        password: hashedPassword,
        role: "Manager",
        status: "ACTIVE"
      },
      {
        name: "Team Member 1",
        email: "member1@taskflow.com",
        password: hashedPassword, 
        role: "Member",
        status: "ACTIVE"
      },
      {
        name: "Team Member 2",
        email: "member2@taskflow.com",
        password: hashedPassword,
        role: "Member",
        status: "ACTIVE"
      },
      {
        name: "Team Member 3", 
        email: "member3@taskflow.com",
        password: hashedPassword,
        role: "Member",
        status: "ACTIVE"
      }
    ];

    await User.insertMany(users);
    console.log(" Seed users completed! Created 5 users");
    
    console.log(" Login info (password: 123456):");
    console.log("Admin: admin@taskflow.com");
    console.log("Manager: manager1@taskflow.com"); 
    console.log("Member: member1@taskflow.com");

    process.exit(0);
  } catch (err) {
    console.error(" Error seeding users:", err);
    process.exit(1);
  }
};

seedUsers();