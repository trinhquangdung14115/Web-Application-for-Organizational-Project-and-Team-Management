import Comment from "../models/comment.model.js";
import User from "../models/user.model.js";
import Task from "../models/task.model.js";
import ProjectMember from "../models/projectMember.model.js";
import ActivityLog from "../models/activityLog.model.js";
import { createNotification } from "../services/notification.service.js";

/**
 * @desc    Create a new comment & trigger mentions
 * @route   POST /tasks/:taskId/comments
 * @access  Private
 */
export const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const currentUser = req.user;

    if (!content) {
      return res.status(400).json({ 
        success: false, 
        message: "Content is required" 
      });
    }

    // Validate existence
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: "Task not found" 
      });
    }

    // Check permission
    const isMember = await ProjectMember.findOne({ 
      projectId: task.projectId, 
      userId: currentUser._id 
    });
    
    if (currentUser.role !== "Admin" && !isMember) {
        return res.status(403).json({ success: false, message: "You are not a member of this project" });
    }

    // Create Comment
    const comment = new Comment({
      taskId,
      userId: currentUser._id,
      content,
    });
    await comment.save();
    
    const mentions = [...content.matchAll(/@([A-Za-zÀ-ỹ0-9_]+)/gi)].map((m) => m[1]);
    
    if (mentions.length > 0) {
      const uniqueNames = [...new Set(mentions)];
      for (const name of uniqueNames) {
        const mentionedUser = await User.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, "i") } 
        });
        if (mentionedUser && String(mentionedUser._id) !== String(currentUser._id)) {
           await createNotification({
            userId: mentionedUser._id,
            type: "MENTION",
            content: `${currentUser.name} mentioned you in task "${task.title}"`,
            metadata: {
                taskId: task._id,
                projectId: task.projectId,
                commentId: comment._id
            }
          });
        }
      }
    }

    try {
      await ActivityLog.create({
        projectId: task.projectId,
        userId: currentUser._id,
        taskId: task._id,
        action: "COMMENT_ADDED",
        content: `commented on task "${task.title}"`
      });
    } catch (e) { console.error("Logging failed:", e.message); }

    await comment.populate("userId", "name email role");
    
    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: comment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all comments for a specific task
 * @route   GET /tasks/:taskId/comments
 * @access  Private
 */
export const getCommentsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ taskId })
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};