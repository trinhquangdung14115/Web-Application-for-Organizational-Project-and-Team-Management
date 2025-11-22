import Project from "../models/project.model.js";
import ProjectMember from "../models/projectMember.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

// POST /projects
export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body || {};
    if (!name) return res.status(400).json({ message: "Project name is required" });

    const creatorId = req.user && req.user._id;
    if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

    const project = new Project({
      name,
      description,
      createdBy: creatorId,
      members: [{ user: creatorId, role: "Manager" }],
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

// DELETE /projects/:id (soft delete)
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

// GET /projects/:id/members -> return mock list if no populated members
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
