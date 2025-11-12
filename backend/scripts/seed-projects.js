import mongoose from "mongoose";
import dotenv from "dotenv";
import Project from "../src/models/project.model.js";
import User from "../src/models/user.model.js";

dotenv.config();

const seedProjects = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding projects");

    const adminUser = await User.findOne({ role: "Admin" });
    if (!adminUser) {
      console.log("Please seed users first!");
      process.exit(1);
    }

    await Project.deleteMany({});

    const projects = [
      {
        name: "Website Redesign",
        description: "Complete overhaul of company website with modern UI/UX",
        status: "ACTIVE",
        createdBy: adminUser._id,
        startDate: new Date("2025-10-01"),
        endDate: new Date("2025-12-31")
      },
      {
        name: "Mobile App Development",
        description: "Native iOS and Android app for customer engagement", 
        status: "ACTIVE",
        createdBy: adminUser._id,
        startDate: new Date("2025-10-15"),
        endDate: new Date("2026-01-31")
      }
    ];

    await Project.insertMany(projects);
    console.log("Seed projects completed! Created 2 projects");

    process.exit(0);
  } catch (err) {
    console.error("Error seeding projects:", err);
    process.exit(1);
  }
};

seedProjects();