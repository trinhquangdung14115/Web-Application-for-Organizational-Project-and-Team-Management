
import mongoose from "mongoose";
import Project from "../models/project.model.js";
import ProjectMember from "../models/projectMember.model.js";
import User from "../models/user.model.js";
import Task from "../models/task.model.js";
import ActivityLog from "../models/activityLog.model.js";

const generateRandomCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// POST /projects
export const createProject = async (req, res) => {
  try {
    const { name, description, deadline, manager } = req.body || {};
    if (!name) return res.status(400).json({ success: false, error: "ValidationError", message: "Project name is required" });

    const creatorId = req.user && req.user._id;
    if (!creatorId) return res.status(401).json({ success: false, error: "AuthenticationError", message: "Unauthorized" });

    // Auto-promote manager if needed
    if (manager && manager !== creatorId) {
        const userToPromote = await User.findById(manager);
        if (userToPromote && userToPromote.role === "Member") {
            userToPromote.role = "Manager";
            await userToPromote.save();
            console.log(`Auto-promoted user ${userToPromote.email} to Manager`);
        }
    }

    const initialMembers = [{ user: creatorId, role: "Admin" }];
    if (manager && manager !== creatorId) {
        initialMembers.push({ user: manager, role: "Manager" });
    }

    const project = new Project({
      name,
      description,
      deadline: deadline || null,
      createdBy: creatorId,
      members: initialMembers,
    });
    await project.save();
    res.status(201).json({ success: true, message: "Project created successfully", data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// GET /projects
export const listProjects = async (req, res) => {
  try {
    const projects = await Project.find({ deletedAt: null });
    res.json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// GET /projects/:id
export const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid id" });
    const project = await Project.findById(id).populate("members.user", "name email role");
    if (!project || project.deletedAt) return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// PUT /projects/:id
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const project = await Project.findByIdAndUpdate(id, data, { new: true });
    if (!project) return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    res.json({ success: true, message: "Project updated successfully", data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// DELETE /projects/:id
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
    if (!project) return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    res.json({ success: true, message: "Project deleted", data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
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
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// PATCH /projects/:id/archive
export const toggleArchive = async (req, res) => {
  try {
    const { id } = req.params;
    const { archive } = req.body || {}; // true to archive, false to unarchive

    const project = await Project.findById(id);
    if (!project || project.deletedAt) {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }

    project.status = archive ? "archived" : "active";
    await project.save();

    res.json({ success: true, message: `Project ${archive ? "archived" : "unarchived"}`, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

/**
 * @desc    Get project dashboard stats (Tasks count, Days left)
 * @route   GET /projects/:id/summary
 */
export const getProjectSummary = async (req, res) => {
  try {
    const {id} = req.params;

    const project = await Project.findById(id);
    if(!project) return res.status(404).json({success:false,error:"NotFoundError", message: "Project not found"});

    const now = new Date();

    const [totalTasks, todo , doing , done , overdue, high, medium, low] = await Promise.all([
      Task.countDocuments({projectId: id, deletedAt: null}),
      Task.countDocuments({projectId: id, status: "TODO", deletedAt: null}),
      Task.countDocuments({projectId: id, status: "DOING", deletedAt: null}),
      Task.countDocuments({projectId: id, status: "DONE", deletedAt: null}),
      // Thêm 3 dòng này để lấy Priority
      Task.countDocuments({ projectId: id, priority: "HIGH", deletedAt: null }),
      Task.countDocuments({ projectId: id, priority: "MEDIUM", deletedAt: null }),
      Task.countDocuments({ projectId: id, priority: "LOW", deletedAt: null }),
      Task.countDocuments({
        projectId : id,
        deletedAt: null,
        dueDate: { $lt: now},
        status: { $ne: "DONE" }
      })
    ]);

    let daysLeft = 0;
    if (project.endDate) {
      const endDateField = project.endDate || project.deadline;
      if (endDateField) {
        const end = new Date(endDateField);
        const diffTime = end - now;
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) daysLeft = 0;
      }
    }
    res.status(200).json({
      success: true,
      data: {
        totalTasks,
        todo,
        doing,
        done,
        overdue,
        daysLeft,
        // Trả thêm Priority về Frontend
        priority: {
            high,
            medium,
            low
        }
      }
    });
  } catch (error){
    res.status(500).json({success:false, error: "ServerError", message: error.message});
  }
};
/**
 * @desc    Get recent activity logs for project
 * @route   GET /projects/:id/activities
 */
export const getProjectActivities = async (req, res) => {
  try {
    const { id } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const total = await ActivityLog.countDocuments({projectId: id});

    const activities = await ActivityLog.find({ projectId: id })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: activities
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "ServerError", message: error.message });
  }
};

// GET /projects/pending-requests
// Hàm này quét tất cả dự án, tìm thành viên có status = "PENDING"
export const getPendingRequests = async (req, res) => {
  try {
    // Tìm các dự án có chứa thành viên PENDING
    const projects = await Project.find({ "members.status": "PENDING" })
      .select("name members") 
      .populate("members.user", "name email avatarUrl");

    let pendingList = [];

    // Tách mảng để lấy ra từng request cụ thể
    projects.forEach(proj => {
      const pendingMembers = proj.members.filter(m => m.status === "PENDING");
      
      pendingMembers.forEach(member => {
        pendingList.push({
          requestId: member._id,      // ID của request (quan trọng để duyệt)
          projectId: proj._id,        // ID dự án (quan trọng để duyệt)
          projectName: proj.name,     // Tên dự án để hiển thị
          user: member.user           // Thông tin user
        });
      });
    });

    res.json({ success: true, data: pendingList });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get current invite code, generate if null
 * @route   GET /projects/:id/invite-code
 * @access  Private (Admin/Manager)
 */
export const getInviteCode = async (req, res) => {
  try {
    const { id } = req.params;
    let project = await Project.findById(id).select('+inviteCode');
    
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    if (project.inviteCode) {
      return res.json({ success: true, code: project.inviteCode });
    }

    for (let i = 0; i < 5; i++) {
        try {
            let newCode;
            do {
                newCode = generateRandomCode(6); 
            } while (await Project.findOne({ inviteCode: newCode }));
            project.inviteCode = newCode;
            await project.save();
            return res.json({ success: true, code: newCode });

        } catch (err) {
            if (err.code === 11000) {
                console.warn(`Invite Code Race Condition detected for project ${id}. Retrying... Attempt ${i + 1}`);
                continue; 
            }
            throw err;
        }
    }
    return res.status(500).json({ success: false, message: "Failed to generate unique invite code after multiple retries." });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Generate a new random invite code
 * @route   PATCH /projects/:id/invite-code
 * @access  Private (Admin/Manager)
 */
export const resetInviteCode = async (req, res) => {
  const { id } = req.params;

  for (let i = 0; i < 5; i++) {
      try {
          let newCode;
          do {
              newCode = generateRandomCode(6);
          } while (await Project.findOne({ inviteCode: newCode }));

          const project = await Project.findByIdAndUpdate(
              id,
              { inviteCode: newCode },
              { new: true, select: '+inviteCode' }
          );

          if (!project) return res.status(404).json({ success: false, message: "Project not found" });
          return res.json({ success: true, message: "Invite code reset successfully", code: project.inviteCode });

      } catch (err) {
          if (err.code === 11000) {
              console.warn(`Reset Code Race Condition detected for project ${id}. Retrying... Attempt ${i + 1}`);
              continue; 
          }
          return res.status(500).json({ success: false, message: err.message });
      }
  }
  return res.status(500).json({ success: false, message: "Failed to reset invite code after multiple retries." });
};

/**
 * @desc    Allow user to join a project using an invite code
 * @route   POST /projects/join
 * @access  Private (Member)
 */
export const joinProjectByCode = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user._id;

    if (!inviteCode) return res.status(400).json({ success: false, message: "Invite code is required" });

    const normalizedCode = inviteCode.toUpperCase().trim();

    const project = await Project.findOne({ inviteCode: normalizedCode, deletedAt: null });
    
    if (!project) {
      return res.status(404).json({ success: false, message: "Invalid or expired invite code." });
    }

    const updatedProject = await Project.findOneAndUpdate(
        { 
            _id: project._id, 
            "members.user": { $ne: userId }
        },
        { 
            $push: { 
                members: { 
                    user: userId, 
                    role: "Member", 
                    status: "ACTIVE"
                } 
            } 
        },
        { new: true }
    );

    if (!updatedProject) {
        return res.status(400).json({ success: false, message: "You are already a member of this project." });
    }

    try {
        await ActivityLog.create({
            projectId: updatedProject._id,
            userId: userId,
            action: "JOIN_PROJECT",
            content: `joined project "${updatedProject.name}" using invite code.`
        });
    } catch (e) { console.error("Logging failed:", e.message); }
    
    res.json({ success: true, message: "Successfully joined project", projectId: updatedProject._id });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};