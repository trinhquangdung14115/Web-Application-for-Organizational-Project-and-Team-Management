import mongoose from "mongoose";
import Attendance from "../models/attendance.model.js";
import Project from "../models/project.model.js";

/**
 * @desc    Get client IP address
 * @param   {Request} req
 * @returns {String} IP address
 */
const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "unknown"
  );
};

/**
 * @desc    Check if user already checked in today
 * @param   {ObjectId} userId
 * @param   {ObjectId} projectId
 * @returns {Object|null} Today's attendance or null
 */
const getTodayAttendance = async (userId, projectId) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return await Attendance.findOne({
    userId,
    projectId,
    checkInTime: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });
};

/**
 * @desc    Check-in attendance
 * @route   POST /projects/:projectId/attendance/checkin
 * @access  Private
 */
export const checkIn = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { note } = req.body;
    const userId = req.user._id;

    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "Invalid project ID format",
      });
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project || project.deletedAt) {
      return res.status(404).json({
        success: false,
        error: "NotFoundError",
        message: "Project not found",
      });
    }

    // Check if user is member of project
    const isMember = project.members.some(
      (m) => String(m.user) === String(userId) && m.status === "ACTIVE"
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: "ForbiddenError",
        message: "You are not a member of this project",
      });
    }

    // Check if already checked in today
    const existingAttendance = await getTodayAttendance(userId, projectId);
    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        error: "ConflictError",
        message: "You have already checked in today",
        data: existingAttendance,
      });
    }

    // Get client IP
    const clientIp = getClientIp(req);

    // Determine status based on time (example: late if after 9 AM)
    const now = new Date();
    const hour = now.getHours();
    const status = hour >= 9 ? "LATE" : "PRESENT";

    // Create attendance record
    const attendance = new Attendance({
      userId,
      projectId,
      checkInTime: now,
      checkInIp: clientIp,
      status,
      note: note || "",
    });

    await attendance.save();

    // Populate user info
    await attendance.populate("userId", "name email role");

    res.status(201).json({
      success: true,
      message: "Check-in successful",
      data: attendance,
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
 * @desc    Get my attendance status for today
 * @route   GET /projects/:projectId/attendance/me
 * @access  Private
 */
export const getMyAttendanceToday = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "Invalid project ID format",
      });
    }

    // Get today's attendance
    const attendance = await getTodayAttendance(userId, projectId);

    if (!attendance) {
      return res.json({
        success: true,
        message: "No check-in record for today",
        data: {
          hasCheckedIn: false,
          status: "ABSENT",
        },
      });
    }

    res.json({
      success: true,
      data: {
        hasCheckedIn: true,
        checkInTime: attendance.checkInTime,
        status: attendance.status,
        note: attendance.note,
        checkInIp: attendance.checkInIp,
      },
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
 * @desc    Get attendance history for a project
 * @route   GET /projects/:projectId/attendance
 * @access  Private (Admin/Manager)
 */
export const getProjectAttendance = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate, userId } = req.query;

    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "Invalid project ID format",
      });
    }

    // Check permissions (only Admin/Manager can view all attendance)
    const userRole = req.user.role;
    if (userRole !== "Admin" && userRole !== "Manager") {
      return res.status(403).json({
        success: false,
        error: "ForbiddenError",
        message: "Only Admin or Manager can view project attendance",
      });
    }

    // Build query
    const query = { projectId };

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          error: "ValidationError",
          message: "Invalid user ID format",
        });
      }
      query.userId = userId;
    }

    if (startDate || endDate) {
      query.checkInTime = {};
      if (startDate) query.checkInTime.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.checkInTime.$lte = end;
      }
    }

    const attendances = await Attendance.find(query)
      .populate("userId", "name email role")
      .sort({ checkInTime: -1 });

    res.json({
      success: true,
      count: attendances.length,
      data: attendances,
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
 * @desc    Get my attendance history
 * @route   GET /attendance/me
 * @access  Private
 */
export const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { projectId, startDate, endDate } = req.query;

    const query = { userId };

    if (projectId) {
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({
          success: false,
          error: "ValidationError",
          message: "Invalid project ID format",
        });
      }
      query.projectId = projectId;
    }

    if (startDate || endDate) {
      query.checkInTime = {};
      if (startDate) query.checkInTime.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.checkInTime.$lte = end;
      }
    }

    const attendances = await Attendance.find(query)
      .populate("projectId", "name")
      .sort({ checkInTime: -1 });

    res.json({
      success: true,
      count: attendances.length,
      data: attendances,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "ServerError",
      message: err.message,
    });
  }
};
