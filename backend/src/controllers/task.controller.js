import mongoose from "mongoose";
import Task from "../models/task.model.js";
import Project from "../models/project.model.js";

/**
 * @desc    Lấy tất cả task trong 1 project (chưa bị xóa)
 * @route   GET /projects/:id/tasks
 * @access  Private (Admin/Manager/Member)
 */
export const getTasksByProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    // Kiểm tra project tồn tại
    const projectExists = await Project.findById(projectId);
    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const tasks = await Task.find({ projectId, deletedAt: null });

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
 * @desc    Lọc task theo project, assignee hoặc status
 * @route   GET /tasks?project=...&assignee=...&status=...
 * @access  Private (Admin/Manager/Member)
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
 * @desc    Tạo task mới trong project
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
      parentId,
    } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Title and dueDate are required.",
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
    const convertedParentId = parentId
      ? new mongoose.Types.ObjectId(parentId)
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
      parentId: convertedParentId,
      projectId: convertedProjectId,
    });

    await task.save();

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
 * @desc    Cập nhật thông tin task (Admin/Manager/Member)
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

    // Member chỉ được update task của chính mình
    if (userRole === "Member") {
      if (String(task.assigneeId) !== String(userId)) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own tasks.",
        });
      }

      // Không cho Member đổi ngoài status
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
 * @desc    Cập nhật trạng thái task (PATCH)
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
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    // Member chỉ được đổi status task chính mình
    if (userRole === "Member" && String(task.assigneeId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Members can only update their own task status.",
      });
    }

    task.status = status || task.status;
    await task.save();

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
 * @desc    Soft delete task (Admin/Manager)
 * @route   DELETE /tasks/:id
 * @access  Private
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

    res.status(200).json({
      success: true,
      message: "Task soft-deleted successfully",
      data: deletedTask,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
