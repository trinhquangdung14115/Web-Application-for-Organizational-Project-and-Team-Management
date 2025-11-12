import mongoose from "mongoose";
import dotenv from "dotenv";
import Task from "../src/models/task.model.js";
import Project from "../src/models/project.model.js";
import User from "../src/models/user.model.js";

dotenv.config();

const seedTasks = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding tasks");

    // Lấy projects và users từ database
    const projects = await Project.find({});
    const users = await User.find({});

    if (projects.length === 0 || users.length === 0) {
      console.log(" Please seed users and projects first!");
      process.exit(1);
    }

    const adminUser = users.find(u => u.role === "Admin");
    const managerUsers = users.filter(u => u.role === "Manager");
    const memberUsers = users.filter(u => u.role === "Member");

    // Tạo mảng tasks
    const mockTasks = [];

    // PROJECT 1 tasks (nếu có ít nhất 1 project)
    if (projects[0]) {
      mockTasks.push(
        {
          title: "Setup backend project structure",
          description: "Initialize Express server, connect MongoDB, setup base routes and middleware",
          priority: "HIGH",
          status: "DONE",
          startDate: new Date("2025-10-01"),
          dueDate: new Date("2025-11-10"),
          estimateHours: 8,
          spentHours: 6,
          orderIndex: 0,
          projectId: projects[0]._id,
          assigneeId: adminUser?._id || users[0]?._id,
        },
        {
          title: "Implement User Authentication",
          description: "Create JWT-based auth with signup, login, and token verification",
          priority: "HIGH",
          status: "DOING",
          startDate: new Date("2025-10-15"),
          dueDate: new Date("2025-11-15"),
          estimateHours: 16,
          spentHours: 8,
          orderIndex: 1,
          projectId: projects[0]._id,
          assigneeId: managerUsers[0]?._id || users[0]?._id,
        },
        {
          title: "Design homepage UI layout",
          description: "Create responsive homepage design with modern components",
          priority: "MEDIUM",
          status: "TODO",
          dueDate: new Date("2025-11-20"),
          estimateHours: 12,
          spentHours: 0,
          orderIndex: 2,
          projectId: projects[0]._id,
          assigneeId: memberUsers[0]?._id || users[0]?._id,
        },
        {
          title: "Fix mobile navigation bugs",
          description: "Address navigation issues on mobile devices and touch screens",
          priority: "CRITICAL",
          status: "TODO",
          dueDate: new Date("2025-11-05"),
          estimateHours: 4,
          spentHours: 0,
          orderIndex: 3,
          projectId: projects[0]._id,
          assigneeId: memberUsers[1]?._id || users[0]?._id,
        }
      );
    }

    // PROJECT 2 tasks (chỉ thêm nếu có ít nhất 2 projects)
    if (projects[1]) {
      mockTasks.push(
        {
          title: "Setup React Native development environment",
          description: "Configure development tools, emulators, and project structure",
          priority: "HIGH",
          status: "DOING",
          startDate: new Date("2025-10-20"),
          dueDate: new Date("2025-11-12"),
          estimateHours: 6,
          spentHours: 3,
          orderIndex: 0,
          projectId: projects[1]._id,
          assigneeId: managerUsers[1]?._id || users[0]?._id,
        },
        {
          title: "Design app icon and splash screen",
          description: "Create visually appealing app icon and loading screen",
          priority: "LOW",
          status: "TODO",
          dueDate: new Date("2025-11-25"),
          estimateHours: 8,
          spentHours: 0,
          orderIndex: 1,
          projectId: projects[1]._id,
          assigneeId: memberUsers[0]?._id || users[0]?._id,
        },
        {
          title: "Implement user profile screen",
          description: "Create profile UI with edit functionality and avatar upload",
          priority: "MEDIUM",
          status: "TODO",
          dueDate: new Date("2025-11-18"),
          estimateHours: 10,
          spentHours: 0,
          orderIndex: 2,
          projectId: projects[1]._id,
          assigneeId: memberUsers[2]?._id || users[0]?._id,
        }
      );
    }

    // CHỈ insert tasks chưa tồn tại
    let createdCount = 0;
    for (const taskData of mockTasks) {
      const exists = await Task.findOne({ 
        title: taskData.title,
        projectId: taskData.projectId 
      });
      
      if (!exists) {
        await Task.create(taskData);
        createdCount++;
      }
    }

    console.log(" Seed tasks completed!");
    console.log(` Created ${createdCount} new tasks`);
    console.log(` For ${projects.length} projects`);
    console.log(` Using ${users.length} users`);
    
    process.exit(0);
  } catch (err) {
    console.error(" Error while seeding tasks:", err);
    process.exit(1);
  }
};

seedTasks();