import * as taskService from "../services/task.service.js";
import mongoose from "mongoose";
/**
 * @desc    Get all tasks in a project
 * @route   GET /projects/:id/tasks
 * @access  Private
 */
export const getTasksByProject = async (req, res) => {
  try {
    const { id } = req.params;
    const tasks = await taskService.getTasksByProject(id);
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

/**
 * @desc    Filter tasks by project, assignee or status
 * @route   GET /tasks
 * @access  Private
 */
export const getFilteredTasks = async (req, res) => {
  try {
    const tasks = await taskService.getFilteredTasks(req.query);
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get single task
 * @route   GET /tasks/:id
 * @access  Private
 */
export const getTasksById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (err) {
    if (err.message === 'INVALID_TASK_ID') {
      return res.status(400).json({ success: false, message: "Invalid Task ID" });
    }
    if (err.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

/**
 * @desc    Create new task
 * @route   POST /projects/:id/tasks
 * @access  Private (Admin/Manager)
 */
export const createTask = async (req, res) => {
  try {
    const currentOrgId = req.user?.currentOrganizationId;
    const userId = req.user?._id;
    const projectId = req.params.id;
    
    if (!projectId || projectId === 'null' || !mongoose.isValidObjectId(projectId)) {
        return res.status(400).json({ 
            success: false, 
            message: "Invalid Project ID. Please select a project first." 
        });
    }
    const task = await taskService.createTask(
      req.body,
      userId,
      projectId,
      currentOrgId
    );
    
    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (err) {
    if (err.message === 'TITLE_REQUIRED') {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ success: false, message: "No active organization. Please switch to an organization first." });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    if (err.message === 'ORGANIZATION_MISMATCH') {
      return res.status(403).json({ success: false, message: "Project does not belong to your organization" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

/**
 * @desc    Update task details
 * @route   PUT /tasks/:id
 * @access  Private
*/
export const updateTask = async (req, res) => {
  try {
    const updatedTask = await taskService.updateTask(
      req.params.id,
      req.body,
      req.user
    );
    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (err) {
    if (err.message === 'INVALID_TASK_ID') {
      return res.status(400).json({ success: false, message: "Invalid Task ID" });
    }
    if (err.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    if (err.message === 'UNAUTHORIZED_ACCESS') {
      return res.status(403).json({ success: false, message: "You can only update your own tasks" });
    }
    if (err.message === 'FORBIDDEN_FIELD_UPDATE') {
      return res.status(403).json({ success: false, message: "Members can only update task status" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

/**
 * @desc    Update only status of a task
 * @route   PATCH /tasks/:id
 * @access  Private
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const task = await taskService.updateTaskStatus(
      req.params.id,
      req.body.status,
      req.user
    );
    res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      data: task,
    });
  } catch (err) {
    if (err.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    if (err.message === 'UNAUTHORIZED_ACCESS') {
      return res.status(403).json({ success: false, message: "Members can only update their own task status" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
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
    const updatedTask = await taskService.reorderTask(taskId, newStatus, newPosition);
    
    res.json({ 
      success: true, 
      message: "Task reordered successfully", 
      data: updatedTask 
    });
  } catch (err) {
    if (err.message === 'MISSING_REQUIRED_FIELDS') {
      return res.status(400).json({ success: false, message: "Missing taskId or newPosition" });
    }
    if (err.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /tasks/:id
 * @access Private (Admin/Manager)
 */
export const deleteTask = async (req, res) => {
  try {
    const deletedTask = await taskService.deleteTask(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: "Task soft-deleted successfully",
      data: deletedTask,
    });
  } catch (err) {
    if (err.message === 'PERMISSION_DENIED') {
      return res.status(403).json({ success: false, message: "You don't have permission to delete tasks" });
    }
    if (err.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

/**
 * @desc  Create a Subtask
 * @route POST/tasks/:taskId/subtasks
 * @acess Private
 */
export const createSubtask = async (req, res) => {
  try {
    const subtask = await taskService.createSubtask(req.params.taskId, req.body.title);
    res.status(201).json({
      success: true,
      message: "Subtask created successfully",
      data: subtask,
    });
  } catch (err) {
    if (err.message === 'TITLE_REQUIRED') {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (err.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

/*
  * @desc    Toggle Subtask Completion status
  * @route   PATCH /tasks/:taskId/subtasks/:subtaskId
  * @access  Private
*/
export const toggleSubtask = async (req, res) => {
  try {
    const updatedTask = await taskService.toggleSubtask(
      req.params.taskId, 
      req.params.subtaskId, 
      req.body.isCompleted
    );
    res.status(200).json({ 
      success: true, 
      message: "Subtask status updated", 
      data: updatedTask 
    });
  } catch (err) {
    if (err.message === 'TASK_OR_SUBTASK_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "Task or Subtask not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};
/*
  * @desc    Delete a Subtask
  * @route   DELETE /tasks/:taskId/subtasks/:subtaskId
  * @access  Private
 */
export const deleteSubtask = async (req, res) => {
  try {
    const updatedTask = await taskService.deleteSubtask(req.params.taskId, req.params.subtaskId);
    res.status(200).json({ 
      success: true, 
      message: "Subtask deleted", 
      data: updatedTask 
    });
  } catch (err) {
    if (err.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

/**
 * @desc Generate subtasks using AI and add them to the task
 * @route POST /tasks/:taskId/magic-subtasks
 * @access Private
 */
export const magicSubtasks = async (req, res) => {
  try {
    const newSubtasks = await taskService.magicSubtasks(req.params.taskId, req.user._id);
    
    const msg = newSubtasks.length > 0 
      ? "AI subtasks added successfully" 
      : "AI did not generate any steps.";

    res.status(200).json({
      success: true,
      message: msg,
      data: newSubtasks 
    });
  } catch (err) {
    if (err.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};