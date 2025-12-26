import * as projectService from "../services/project.service.js";
import ProjectMember from "../models/projectMember.model.js"; // Import thêm để xử lý các logic phụ
import Project from "../models/project.model.js";
import mongoose from "mongoose";

// GET /projects/:id/members
export const getMembers = async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy organizationId từ user đã đăng nhập (do middleware auth gán vào)
    const currentOrganizationId = req.user?.currentOrganizationId;

    // Gọi Service lấy danh sách (đã fix populate và format data ở bước trước)
    const members = await projectService.getProjectMembers(id, currentOrganizationId);

    res.status(200).json({
      success: true,
      data: members 
    });
  } catch (err) {
    console.error("Get Members Error:", err);
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// POST /projects/:id/members (Admin/Manager add member trực tiếp)
export const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;
    const currentOrganizationId = req.user?.currentOrganizationId;

    if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Gọi Service thêm thành viên
    await projectService.addMember(id, userId, role, currentOrganizationId);

    // Lấy lại danh sách mới nhất để trả về cho Frontend cập nhật UI
    const members = await projectService.getProjectMembers(id, currentOrganizationId);
    
    // Tìm đúng member vừa add để trả về
    const addedMember = members.find(m => String(m.userId) === String(userId));

    res.status(201).json({ 
        success: true, 
        message: "Member added successfully", 
        data: addedMember || members[0] // Fallback
    });
  } catch (err) {
    console.error("Add Member Error:", err);
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// DELETE /projects/:id/members/:memberId
export const removeMember = async (req, res) => {
  try {
    const { id: projectId, memberId } = req.params;
    const currentOrganizationId = req.user?.currentOrganizationId;
    const requestorId = req.user._id; // ID của người thực hiện hành động xóa

    // --- LOGIC QUAN TRỌNG ĐỂ KHỚP FRONTEND ---
    // Frontend đang gửi 'memberId' là ID của bản ghi ProjectMember (membershipId).
    // Nhưng Service removeMember lại cần 'userId'.
    // Ta phải tìm userId từ membershipId trước.
    let userIdToDelete = memberId;
    
    if (mongoose.isValidObjectId(memberId)) {
        const membership = await ProjectMember.findById(memberId);
        if (membership) {
            userIdToDelete = membership.userId; // Lấy ra User ID thật
        }
    }
    // ------------------------------------------

    await projectService.removeMember(projectId, userIdToDelete, requestorId, currentOrganizationId);

    res.json({ success: true, message: "Member removed successfully" });
  } catch (err) {
    console.error("Remove Member Error:", err);
    
    // Handle specific errors
    if (err.message === 'FORBIDDEN_PROJECT_ACTION') {
         return res.status(403).json({ success: false, message: "Forbidden: You don't have permission to remove members" });
    }
    if (err.message === 'CANNOT_REMOVE_CREATOR') {
         return res.status(400).json({ success: false, message: "Cannot remove project creator/owner" });
    }
    if (err.message === 'INSUFFICIENT_PERMISSIONS') {
         return res.status(403).json({ success: false, message: "Insufficient permissions: Cannot remove member with equal or higher role" });
    }
    if (err.message === 'CANNOT_REMOVE_SELF') {
         return res.status(400).json({ success: false, message: "Cannot remove yourself from project" });
    }
    
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// POST /projects/:id/join (User xin vào dự án)
export const joinRequest = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: "Invalid project ID" });
    }

    // Check xem đã là member chưa (dùng bảng ProjectMember mới)
    const existingMember = await ProjectMember.findOne({ projectId, userId });
    
    if (existingMember) {
      return res.status(409).json({ 
        success: false, 
        message: `You are already a member or request is pending (Status: ${existingMember.status})` 
      });
    }

    // Tạo request mới với status PENDING
    // (Vì Service chưa có hàm này nên ta gọi trực tiếp Model ở đây cho nhanh)
    await ProjectMember.create({
        projectId,
        userId,
        roleInProject: "Member",
        status: "PENDING",
        organizationId: req.user.currentOrganizationId // Lưu ý phải có OrgId
    });

    res.status(201).json({ success: true, message: "Join request submitted", data: { status: "PENDING" } });
  } catch (err) {
    console.error("Join Request Error:", err);
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// PATCH /projects/:projectId/members/:memberId/approve (Duyệt/Từ chối thành viên)
export const approveMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params; // memberId ở đây là Membership ID
    const { action } = req.body; // "approve" hoặc "reject"

    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ success: false, message: "Invalid action" });
    }

    const member = await ProjectMember.findById(memberId);
    if (!member) {
        return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (action === "approve") {
        member.status = "ACTIVE";
    } else {
        member.status = "REJECTED"; // Hoặc có thể xóa luôn bản ghi tùy logic của mày
    }
    
    await member.save();

    res.json({ success: true, message: `Member request ${action}d`, data: member });
  } catch (err) {
    console.error("Approve Member Error:", err);
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};