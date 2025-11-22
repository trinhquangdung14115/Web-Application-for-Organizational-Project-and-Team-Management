import mongoose from "mongoose";
import Task from "../models/task.model.js";
import Project from "../models/project.model.js";
import ActivityLog from "../models/activityLog.model.js";

/**
 * @desc    Get all tasks in a project (not deleted)
 * @route   GET /projects/:id/tasks
 * @access  Private
 */
export const getTasksByProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    const projectExists = await Project.findById(projectId);
    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const tasks = await Task.find({ projectId, deletedAt: null })
      .populate("assigneeId", "name email role")
      .populate("projectId", "name");

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Filter tasks by project, assignee, or status
 * @route   GET /tasks
 * @access  Private
 */
export const getFilteredTasks = async (req, res) => {
  try {
    const { project, assignee, status } = req.query;
    const filter = { deletedAt: null };
    if (project) filter.projectId = project;
    if (assignee) filter.assigneeId = assignee;
    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .populate("assigneeId", "name email role")
      .populate("projectId", "name");

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create a new task inside a project
 * @route   POST /projects/:id/tasks
 * @access  Private (Admin/Manager)
 */
export const createTask = async (req, res) => {
  try {
    const projectId = req.params.id;
    const {
      title,
      description,
      priority,
      status,
      assigneeId,
      startDate,
      dueDate,
      estimateHours,
      spentHours,
      orderIndex,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required.",
      });
    }

    const projectExists = await Project.findById(projectId);
    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const convertedProjectId = new mongoose.Types.ObjectId(projectId);
    const convertedAssigneeId = assigneeId
      ? new mongoose.Types.ObjectId(assigneeId)
      : null;

    const task = new Task({
      title,
      description,
      priority,
      status,
      assigneeId: convertedAssigneeId,
      startDate,
      dueDate,
      estimateHours,
      spentHours,
      orderIndex,
      projectId: convertedProjectId,
    });

    await task.save();

    // Activity Log: Create Task
    try {
      await ActivityLog.create({
        projectId: task.projectId,
        userId: req.user._id,
        taskId: task._id,
        action: "CREATE_TASK",
        content: `created task "${task.title}"`
      });
    } catch (logError) {
      console.error("Logging failed:", logError.message);
    }

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update task details
 * @route   PUT /tasks/:id
 * @access  Private
 */
export const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userRole = req.user?.role;
    const userId = req.user?._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (userRole === "Member") {
      if (String(task.assigneeId) !== String(userId)) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own tasks.",
        });
      }
      const allowedKeys = ["status"];
      const invalid = Object.keys(req.body).some(
        (key) => !allowedKeys.includes(key)
      );
      if (invalid) {
        return res.status(403).json({
          success: false,
          message: "Members can only update task status.",
        });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, req.body, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update only the status of a task
 * @route   PATCH /tasks/:id
 * @access  Private
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body;
    const userRole = req.user?.role;
    const userId = req.user?._id;

    const task = await Task.findById(taskId);
    if (!task)
      return res.status(404).json({ success: false, message: "Task not found" });

    if (userRole === "Member" && String(task.assigneeId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Members can only update their own task status.",
      });
    }

    const oldStatus = task.status;
    task.status = status || task.status;
    await task.save();

    // Activity Log: Update Status
    try {
      await ActivityLog.create({
        projectId: task.projectId,
        userId: req.user._id,
        taskId: task._id,
        action: "UPDATE_STATUS",
        content: `updated status from ${oldStatus} to ${status}`
      });
    } catch (logError) {
      console.error("Logging failed:", logError.message);
    }

    res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      data: task,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Soft delete a task
 * @route   DELETE /tasks/:id
 * @access  Private (Admin/Manager)
 */
export const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userRole = req.user?.role;

    if (!["Admin", "Manager"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete tasks.",
      });
    }

    const deletedTask = await Task.findByIdAndUpdate(
      taskId,
      { deletedAt: new Date() },
      { new: true }
    );

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Activity Log: Delete Task
    try {
      await ActivityLog.create({
        projectId: deletedTask.projectId,
        userId: req.user._id,
        taskId: deletedTask._id,
        action: "DELETE_TASK",
        content: `deleted task "${deletedTask.title}"`
      });
    } catch (e) { console.error(e); }

    res.status(200).json({
      success: true,
      message: "Task soft-deleted successfully",
      data: deletedTask,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create a subtask (Embedded)
 * @route   POST /tasks/:taskId/subtasks
 * @access  Private
 */
export const createSubtask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ 
        success: false, 
        message: "Title is required" 
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: "Task not found" 
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { 
        $push: { subtasks: { title, isCompleted: false } } 
      },
      { new: true }
    );

    // Get the last element (newly created subtask)
    const newSubtask = updatedTask.subtasks[updatedTask.subtasks.length - 1];

    res.status(201).json({
      success: true,
      message: "Subtask created successfully",
      data: newSubtask,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Toggle subtask completion status
 * @route   PATCH /tasks/:taskId/subtasks/:subtaskId
 * @access  Private
 */
export const toggleSubtask = async (req, res) => {
  try {
    const { taskId, subtaskId } = req.params;
    const { isCompleted } = req.body;

    const updatedTask = await Task.findOneAndUpdate(
      { "_id": taskId, "subtasks._id": subtaskId },
      { 
        $set: { "subtasks.$.isCompleted": isCompleted }
      },
      { new: true }
    );

    if (!updatedTask) return res.status(404).json({ success: false, message: "Task or Subtask not found" });

    res.status(200).json({ success: true, message: "Subtask status updated", data: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a subtask
 * @route   DELETE /tasks/:taskId/subtasks/:subtaskId
 * @access  Private
 */
export const deleteSubtask = async (req, res) => {
  try {
    const { taskId, subtaskId } = req.params;

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { 
        $pull: { subtasks: { _id: subtaskId } } 
      },
      { new: true }
    );

    if (!updatedTask) return res.status(404).json({ success: false, message: "Task not found" });

    res.status(200).json({ success: true, message: "Subtask deleted", data: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};