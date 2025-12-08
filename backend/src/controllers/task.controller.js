import mongoose from "mongoose";
import Task from "../models/task.model.js";
import Project from "../models/project.model.js";
import ActivityLog from "../models/activityLog.model.js";
import AIService from "../services/ai.service.js";

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

    // Sort theo orderIndex tăng dần (Task nào index nhỏ nằm trên)
    const tasks = await Task.find({ projectId, deletedAt: null })
      .sort({ orderIndex: 1 }) 
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
      .sort({ orderIndex: 1 })
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
 * @desc    Get single task by ID
 * @route   GET /tasks/:id
 * @access  Private
 */
export const getTasksById = async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await Task.findById(taskId)
      .populate("assigneeId", "name email role")
      .populate("projectId", "name");

    if (!task || task.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Error getTasksById:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
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
      // orderIndex, // Không lấy từ body nữa mà tự tính
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

    // === LOGIC MỚI: Tự động tính Order Index theo Priority ===
    // High: ~1000 (Lên đầu)
    // Medium: ~5000 (Ở giữa)
    // Low: ~9000 (Xuống cuối)
    let baseIndex = 5000; 
    if (priority === 'High' || priority === 'HIGH') baseIndex = 1000;
    if (priority === 'Low' || priority === 'LOW') baseIndex = 9000;

    // Cộng thêm phần thập phân từ timestamp để tránh trùng lặp tuyệt đối
    // Ví dụ: 5000.4521
    const calculatedOrderIndex = baseIndex + ((Date.now() % 10000) / 10000);
    // ========================================================

    const task = new Task({
      title,
      description,
      priority: priority || 'Medium',
      status,
      assigneeId: convertedAssigneeId,
      startDate,
      dueDate,
      estimateHours,
      spentHours,
      orderIndex: calculatedOrderIndex, // <--- Gán giá trị vừa tính
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

    try {
        await ActivityLog.create({
          projectId: task.projectId,
          userId: req.user._id,
          taskId: task._id,
          action: "UPDATE_TASK",
          content: `updated details for task "${updatedTask.title}"`
        });
    } catch (e) { console.error(e); }

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
 * @desc    Reorder Task (Kanban Drag & Drop)
 * @route   PATCH /tasks/reorder
 * @access  Private
 */
export const reorderTask = async (req, res) => {
  try {
    const { taskId, newStatus, newPosition } = req.body;

    // Validate dữ liệu
    if (!taskId || newPosition === undefined) {
        return res.status(400).json({ success: false, message: "Missing taskId or newPosition" });
    }

    // Update Task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { 
        $set: { 
          status: newStatus,       // Cập nhật cột (nếu có đổi cột)
          orderIndex: newPosition  // Cập nhật vị trí (số thực)
        } 
      },
      { new: true } // Trả về data mới nhất sau update
    );

    if (!updatedTask) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.json({ success: true, message: "Task reordered successfully", data: updatedTask });

  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
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

/**
 * @desc    Generate subtasks using AI and add them to the task
 * @route   POST /tasks/:taskId/magic-subtasks
 * @access  Private
 */
export const magicSubtasks = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id; 
    
    const task = await Task.findById(taskId);
    if (!task || task.deletedAt) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const subtaskTitles = await AIService.generateSubtasks(
        task.title, 
        task.description || "" 
    );

    if (!subtaskTitles || subtaskTitles.length === 0) {
        return res.status(200).json({ success: true, message: "AI did not generate any steps.", data: [] });
    }

    const newSubtasks = subtaskTitles.map(title => ({ title, isCompleted: false }));
    
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { 
        $push: { subtasks: { $each: newSubtasks } } 
      },
      { new: true }
    );

    try {
        await ActivityLog.create({
            projectId: task.projectId,
            userId: userId,
            taskId: taskId,
            action: "AI_SUGGESTION",
            content: `generated ${newSubtasks.length} subtasks using AI for task "${task.title}"`
        });
    } catch (logError) {
        console.error("AI Log Error:", logError.message);
    }

    res.status(200).json({
      success: true,
      message: "AI subtasks added successfully",
      data: updatedTask.subtasks 
    });

  } catch (error) {
    console.error("Controller Error (Magic Subtasks):", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};