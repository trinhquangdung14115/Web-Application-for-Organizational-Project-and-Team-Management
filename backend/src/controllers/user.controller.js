import mongoose from "mongoose";
import User from "../models/user.model.js";
import OrganizationMember from "../models/organizationMember.model.js";

// GET /users (admin only)
export const listUsers = async (req, res) => {
  try {
    // 1. Lấy Org ID từ user đang đăng nhập
    const currentOrgId = req.user.currentOrganizationId;

    if (!currentOrgId) {
      return res.status(400).json({ success: false, message: "No organization context found." });
    }

    // 2. Tạo bộ lọc: Chỉ lấy user thuộc Org này
    const query = { 
      deletedAt: null,
      organizations: currentOrgId // Mongoose tự tìm xem currentOrgId có nằm trong mảng organizations không
    };

    // 3. Hỗ trợ lọc theo Role (Frontend gửi ?role=Manager sẽ chỉ lấy Manager)
    if (req.query.role) {
      query.role = req.query.role;
    }

    // 4. Thực thi query
    const users = await User.find(query)
      .select("name email role status avatar createdAt updatedAt organizations currentOrganizationId")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};
// GET /users/search?q=...
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Query must be at least 2 characters" });
    }

    // Get current user's organization
    const currentUser = await User.findById(req.user._id);
    if (!currentUser || !currentUser.currentOrganizationId) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "You are not currently in any organization",
      });
    }

    // Find all users in the same organization
    const orgMembers = await OrganizationMember.find({
      organizationId: currentUser.currentOrganizationId,
      deletedAt: null,
      status: "ACTIVE",
    }).select("userId");

    const userIdsInOrg = orgMembers.map((m) => m.userId);

    // Search users within the organization
    const users = await User.find({
      _id: { $in: userIdsInOrg },
      deletedAt: null,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
      ]
    })
      .select("name email role status avatar organizations currentOrganizationId")
      .limit(20);

    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /users/:id
 * @access  Private (Admin only)
 */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentOrgId = req.user.currentOrganizationId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    // [QUAN TRỌNG] Tìm user theo ID NHƯNG phải thuộc cùng Org
    const user = await User.findOne({
      _id: id,
      organizations: currentOrgId, // Chặn việc soi thông tin user công ty khác
      deletedAt: null
    }).select("name email role status createdAt updatedAt");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found in this organization" });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

/**
 * @desc    Update user status (Block/Unblock)
 * @route   PATCH /users/:id/status
 * @access  Private (Admin only)
 */
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "Invalid user ID format",
      });
    }

    // Validate status
    const validStatuses = ["ACTIVE", "INACTIVE", "BLOCKED"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Find user
    const user = await User.findById(id);
    if (!user || user.deletedAt) {
      return res.status(404).json({
        success: false,
        error: "NotFoundError",
        message: "User not found",
      });
    }

    // Prevent admin from blocking themselves
    if (String(user._id) === String(req.user._id) && status === "BLOCKED") {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "You cannot block yourself",
      });
    }

    // Update status
    user.status = status;
    await user.save();

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

/**
 * @desc    Delete user (soft delete)
 * @route   DELETE /users/:id
 * @access  Private (Admin only)
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "Invalid user ID format",
      });
    }

    // Find user
    const user = await User.findById(id);
    if (!user || user.deletedAt) {
      return res.status(404).json({
        success: false,
        error: "NotFoundError",
        message: "User not found",
      });
    }

    // Prevent admin from deleting themselves
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "You cannot delete yourself",
      });
    }

    // Soft delete
    user.deletedAt = new Date();
    user.status = "INACTIVE";
    await user.save();

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};