import mongoose from "mongoose";
import Project from "../models/project.model.js";
import ProjectMember from "../models/projectMember.model.js";
import User from "../models/user.model.js";
import Task from "../models/task.model.js";
import ActivityLog from "../models/activityLog.model.js";

// POST /projects
export const createProject = async (req, res) => {
  try {
    const { name, description, deadline, manager } = req.body || {};
    if (!name) return res.status(400).json({ message: "Project name is required" });
    const creatorId = req.user && req.user._id;
    if (!creatorId) return res.status(401).json({ message: "Unauthorized" });
    if (manager && manager !== creatorId) {
        const userToPromote = await User.findById(manager);
        // Nếu tìm thấy user và họ đang là Member -> Thăng chức lên Manager
        if (userToPromote && userToPromote.role === "Member") {
            userToPromote.role = "Manager";
            await userToPromote.save();
            console.log(`Auto-promoted user ${userToPromote.email} to Manager`);
        }
    }
    const initialMembers = [{ user: creatorId, role: "Admin" }];
    // - Nếu người dùng chọn Manager khác với người tạo, thêm họ vào danh sách
    if (manager && manager !== creatorId) {
        initialMembers.push({ user: manager, role: "Manager" });
    } else if (manager === creatorId) {
    }
    const project = new Project({
      name,
      description,
      deadline: deadline || null, 
      createdBy: creatorId,
      members: initialMembers,  
    });
    await project.save();
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /projects
export const listProjects = async (req, res) => {
  try {
    const projects = await Project.find({ deletedAt: null });
    res.json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /projects/:id
export const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });
    const project = await Project.findById(id).populate("members.user", "name email role");
    if (!project || project.deletedAt) return res.status(404).json({ message: "Project not found" });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /projects/:id
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const project = await Project.findByIdAndUpdate(id, data, { new: true });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /projects/:id
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ success: true, message: "Project deleted", data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /projects/:id/members
export const getProjectMembers = async (req, res) => {
  try {
    const { id } = req.params; //  projectId

    // Query bảng riêng ProjectMember
    const members = await ProjectMember.find({ projectId: id })
      .populate("userId", "name email"); // Chỉ lấy name, email từ bảng User

    //  Chuẩn hóa dữ liệu trả về FE
    const formattedData = members.map((m) => {
        // Guard clause: Đề phòng user bị xóa khỏi DB
        if (!m.userId) return null;

        return {
            userId: m.userId._id,        // ID của User
            name: m.userId.name,         // Tên từ bảng User
            email: m.userId.email,       // Email từ bảng User
            projectRole: m.roleInProject,// Role trong dự án (Manager/Member)
            status: m.status,            // Trạng thái (ACTIVE/PENDING)
            joinedAt: m.createdAt
        };
    }).filter(m => m !== null); // Lọc bỏ null

    res.status(200).json({ 
        success: true, 
        data: formattedData 
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get project dashboard stats (Tasks count, Days left)
 * @route   GET /projects/:id/summary
 */
export const getProjectSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const tasks = await Task.find({ projectId: id, deletedAt: null });
    
    const totalTasks = tasks.length;
    const todo = tasks.filter(t => t.status === "TODO").length;
    const doing = tasks.filter(t => t.status === "DOING").length;
    const done = tasks.filter(t => t.status === "DONE").length;

    let daysLeft = 0;
    if (project.endDate) {
      const end = new Date(project.endDate);
      const now = new Date();
      const diffTime = end - now;
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (daysLeft < 0) daysLeft = 0;
    }

    res.status(200).json({
      success: true,
      data: {
        totalTasks,
        todo,
        doing,
        done,
        daysLeft
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get recent activity logs for project
 * @route   GET /projects/:id/activities
 */
export const getProjectActivities = async (req, res) => {
  try {
    const { id } = req.params;
    
    const activities = await ActivityLog.find({ projectId: id })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
