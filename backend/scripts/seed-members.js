import mongoose from "mongoose";
import dotenv from "dotenv";
import Project from "../src/models/project.model.js";
import User from "../src/models/user.model.js";
import ProjectMember from "../src/models/projectMember.model.js"; // Import model mới

dotenv.config();

const seedMembers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding members...");

    // 1. Lấy dữ liệu cũ
    const projects = await Project.find({});
    const users = await User.find({});

    if (projects.length === 0 || users.length === 0) {
      console.log(" Phải chạy seed-users và seed-projects trước!");
      process.exit(1);
    }

    // 2. Xóa sạch dữ liệu cũ bảng ProjectMember
    await ProjectMember.deleteMany({});

    const membersPayload = [];

    // --- KỊCH BẢN SEED ---
    
    // Dự án 1: Website Redesign
    // Gán User[0] (Admin) làm Manager
    membersPayload.push({
      projectId: projects[0]._id,
      userId: users[0]._id,
      roleInProject: "Manager",
      status: "ACTIVE"
    });
    
    // Gán User[1] làm Member
    membersPayload.push({
      projectId: projects[0]._id,
      userId: users[1]._id,
      roleInProject: "Member",
      status: "ACTIVE"
    });

    // Gán User[2] làm Member đang chờ duyệt (PENDING) -> Để test tính năng Duyệt
    membersPayload.push({
      projectId: projects[0]._id,
      userId: users[2]._id,
      roleInProject: "Member",
      status: "PENDING" 
    });

    // Dự án 2: Mobile App
    // Gán User[1] làm Manager
    if (projects[1]) {
        membersPayload.push({
            projectId: projects[1]._id,
            userId: users[1]._id, // User này vừa là Member dự án kia, vừa là Manager dự án này
            roleInProject: "Manager",
            status: "ACTIVE"
        });
    }

    // 3. Lưu vào DB
    await ProjectMember.insertMany(membersPayload);
    
    console.log("Seed ProjectMembers completed!");
    console.log(`Created ${membersPayload.length} membership records.`);
    
    process.exit(0);
  } catch (err) {
    console.error("Error seeding members:", err);
    process.exit(1);
  }
};

seedMembers();