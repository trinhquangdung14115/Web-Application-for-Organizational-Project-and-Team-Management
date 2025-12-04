import mongoose from "mongoose";
import Meeting from "../models/meeting.model.js";
import Project from "../models/project.model.js";

/**
 * @desc    Check for time conflicts in meetings
 * @param   {ObjectId} projectId
 * @param   {Date} startTime
 * @param   {Date} endTime
 * @param   {ObjectId} excludeMeetingId - Optional, for update operations
 * @returns {Boolean} true if conflict exists
 */
const hasTimeConflict = async (projectId, startTime, endTime, excludeMeetingId = null) => {
  const query = {
    projectId,
    deletedAt: null,
    $or: [
      // New meeting starts during existing meeting
      { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
      // New meeting ends during existing meeting
      { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
      // New meeting completely contains existing meeting
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
    ],
  };

  if (excludeMeetingId) {
    query._id = { $ne: excludeMeetingId };
  }

  const conflictingMeeting = await Meeting.findOne(query);
  return !!conflictingMeeting;
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
    const { projectId } = req.params;
    const { title, description, startTime, endTime, location, attendees } = req.body;

    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "Invalid project ID format",
      });
    }

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "Meeting title is required",
      });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "Start time and end time are required",
      });
    }

    // Validate time logic
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "Start time must be before end time",
      });
    }

    // Check project exists
    const project = await Project.findById(projectId);
    if (!project || project.deletedAt) {
      return res.status(404).json({
        success: false,
        error: "NotFoundError",
        message: "Project not found",
      });
    }

    // Check for time conflicts
    const hasConflict = await hasTimeConflict(projectId, start, end);
    if (hasConflict) {
      return res.status(409).json({
        success: false,
        error: "ConflictError",
        message: "Meeting time conflicts with an existing meeting in this project",
      });
    }

    // Create meeting
    const meeting = new Meeting({
      projectId,
      title,
      description: description || "",
      startTime: start,
      endTime: end,
      location: location || "",
      attendees: attendees || [],
      createdBy: req.user._id,
    });

    await meeting.save();

    // Populate before returning
    await meeting.populate("createdBy", "name email");
    await meeting.populate("attendees", "name email");

    res.status(201).json({
      success: true,
      message: "Meeting created successfully",
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
    if (location !== undefined) meeting.location = location;
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
