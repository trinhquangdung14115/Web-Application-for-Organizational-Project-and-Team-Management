import mongoose from "mongoose";
import Meeting from "../models/meeting.model.js";
import Project from "../models/project.model.js";
import { createNotification } from "../services/notification.service.js";
import ProjectMember from "../models/projectMember.model.js";

// --- HELPER FUNCTION: CHECK TRÙNG LỊCH ---
const hasTimeConflict = async (projectId, start, end, excludeMeetingId = null) => {
    const query = {
        projectId,
        deletedAt: null,
        $or: [
            // Logic: Cuộc họp mới bắt đầu trước khi cuộc họp cũ kết thúc VÀ kết thúc sau khi cuộc họp cũ bắt đầu
            { startTime: { $lt: end }, endTime: { $gt: start } }
        ]
    };

    if (excludeMeetingId) {
        query._id = { $ne: excludeMeetingId };
    }

    const count = await Meeting.countDocuments(query);
    return count > 0;
};

/**
 * @desc    Get all meetings for a project
 * @route   GET /projects/:projectId/meetings
 * @access  Private
 */
export const getMeetings = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "Invalid project ID format",
      });
    }

    const project = await Project.findById(projectId);
    if (!project || project.deletedAt) {
      return res.status(404).json({
        success: false,
        error: "NotFoundError",
        message: "Project not found",
      });
    }

    const meetings = await Meeting.find({ projectId, deletedAt: null })
      .populate("createdBy", "name email")
      .populate("attendees", "name email")
      .sort({ startTime: 1 });

    res.json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "ServerError",
      message: err.message,
    });
  }
};

/**
 * @desc    Get single meeting
 * @route   GET /meetings/:id
 * @access  Private
 */
export const getMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "Invalid meeting ID format",
      });
    }

    const meeting = await Meeting.findById(id)
      .populate("createdBy", "name email")
      .populate("attendees", "name email")
      .populate("projectId", "name");

    if (!meeting || meeting.deletedAt) {
      return res.status(404).json({
        success: false,
        error: "NotFoundError",
        message: "Meeting not found",
      });
    }

    res.json({
      success: true,
      data: meeting,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "ServerError",
      message: err.message,
    });
  }
};

/**
 * @desc    Create new meeting
 * @route   POST /projects/:projectId/meetings
 * @access  Private (Admin/Manager)
 */
export const createMeeting = async (req, res) => {
  try {
    // Lấy projectId từ params hoặc body đều được (ưu tiên body để khớp với logic form)
    const { projectId, title, startTime, endTime, location, description } = req.body;
    
    const userId = req.user._id;
    const currentOrgId = req.user.currentOrganizationId;

    if (!projectId) {
        return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    // Validate Time
    if (new Date(startTime) >= new Date(endTime)) {
        return res.status(400).json({ success: false, message: "Start time must be before end time" });
    }

    // Check conflict (chặn trùng lịch)
    const isConflict = await hasTimeConflict(projectId, startTime, endTime);
    if (isConflict) {
         return res.status(409).json({ success: false, message: "Meeting time conflicts with an existing meeting." });
    }

    // 1. TỰ ĐỘNG LẤY TẤT CẢ THÀNH VIÊN DỰ ÁN
    const projectMembers = await ProjectMember.find({ 
        projectId, 
        status: "ACTIVE" 
    }).select("userId");

    // Tạo danh sách ID thành viên
    const allMemberIds = projectMembers.map(m => m.userId);

    // 2. Tạo cuộc họp
    const meeting = new Meeting({
      organizationId: currentOrgId,
      projectId,
      title,
      description,
      startTime,
      endTime,
      location,
      createdBy: userId,
      attendees: allMemberIds // Lưu tất cả thành viên vào
    });

    await meeting.save();

    // 3. GỬI THÔNG BÁO (Trừ người tạo)
    const recipients = allMemberIds.filter(id => id.toString() !== userId.toString());

    // Chạy song song để không block response
    Promise.all(recipients.map(recipientId => 
        createNotification({
            userId: recipientId,
            type: 'MEETING_CREATED',
            content: `New meeting: "${title}" at ${new Date(startTime).toLocaleString('en-GB')}`,
            metadata: {
                meetingId: meeting._id,
                projectId: projectId
            }
        })
    )).catch(err => console.error("Notification Error:", err));

    res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      data: meeting,
    });

  } catch (error) {
    console.error("Create Meeting Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update meeting
 * @route   PATCH /meetings/:id
 * @access  Private (Admin/Manager/Creator)
 */
export const updateMeeting = async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, startTime, endTime, location, attendees } = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: "ValidationError",
          message: "Invalid meeting ID format",
        });
      }
  
      const meeting = await Meeting.findById(id);
      if (!meeting || meeting.deletedAt) {
        return res.status(404).json({
          success: false,
          error: "NotFoundError",
          message: "Meeting not found",
        });
      }
  
      // Check permissions (only creator, admin, or manager can update)
      const userRole = req.user.role;
      const isCreator = String(meeting.createdBy) === String(req.user._id);
  
      if (!isCreator && userRole !== "Admin" && userRole !== "Manager") {
        return res.status(403).json({
          success: false,
          error: "ForbiddenError",
          message: "You don't have permission to update this meeting",
        });
      }
  
      // Validate time if provided
      if (startTime || endTime) {
        const start = startTime ? new Date(startTime) : meeting.startTime;
        const end = endTime ? new Date(endTime) : meeting.endTime;
  
        if (start >= end) {
          return res.status(400).json({
            success: false,
            error: "ValidationError",
            message: "Start time must be before end time",
          });
        }
  
        // Check for time conflicts (excluding current meeting)
        const hasConflict = await hasTimeConflict(meeting.projectId, start, end, meeting._id);
        if (hasConflict) {
          return res.status(409).json({
            success: false,
            error: "ConflictError",
            message: "Meeting time conflicts with an existing meeting in this project",
          });
        }
  
        meeting.startTime = start;
        meeting.endTime = end;
      }
  
      // Update fields
      if (title) meeting.title = title;
      if (description !== undefined) meeting.description = description;
      if (location !== undefined) {
        if (!location || !location.trim()) {
          return res.status(400).json({
            success: false,
            error: "ValidationError",
            message: "Meeting location is required",
          });
        }
        meeting.location = location.trim();
      }
      if (attendees) meeting.attendees = attendees;
  
      await meeting.save();
  
      // Populate before returning
      await meeting.populate("createdBy", "name email");
      await meeting.populate("attendees", "name email");
  
      res.json({
        success: true,
        message: "Meeting updated successfully",
        data: meeting,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: "ServerError",
        message: err.message,
      });
    }
  };
  
  /**
   * @desc    Delete meeting (soft delete)
   * @route   DELETE /meetings/:id
   * @access  Private (Admin/Manager/Creator)
   */
  export const deleteMeeting = async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: "ValidationError",
          message: "Invalid meeting ID format",
        });
      }
  
      const meeting = await Meeting.findById(id);
      if (!meeting || meeting.deletedAt) {
        return res.status(404).json({
          success: false,
          error: "NotFoundError",
          message: "Meeting not found",
        });
      }
  
      // Check permissions
      const userRole = req.user.role;
      const isCreator = String(meeting.createdBy) === String(req.user._id);
  
      if (!isCreator && userRole !== "Admin" && userRole !== "Manager") {
        return res.status(403).json({
          success: false,
          error: "ForbiddenError",
          message: "You don't have permission to delete this meeting",
        });
      }
  
      meeting.deletedAt = new Date();
      await meeting.save();
  
      res.json({
        success: true,
        message: "Meeting deleted successfully",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: "ServerError",
        message: err.message,
      });
    }
  };