import * as taskService from "../services/task.service.js";
import mongoose from "mongoose";
import Task from "../models/task.model.js"; 
import { createNotification } from "../services/notification.service.js";
import { logActivity } from "../services/activityLog.service.js";

/**
 * @desc    Get all tasks in a project
 * @route   GET /projects/:id/tasks
 * @access  Private
 */
export const getTasksByProject = async (req, res) => {
  try {
    console.log('[getTasksByProject] Request:', { projectId: req.params.id, user: req.user?._id });
    const { id } = req.params;
    const tasks = await taskService.getTasksByProject(id);
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    console.error('[getTasksByProject] Error:', err.message);
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
    console.log('[getFilteredTasks] Query:', req.query);
    const tasks = await taskService.getFilteredTasks(req.query);
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    console.error('[getFilteredTasks] Error:', err.message);
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
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;

    console.log('[getTasksById] Request:', {
      taskId: req.params.id,
      userId,
      userRole
    });
    
    const task = await taskService.getTaskById(
      req.params.id, 
      userId, 
      userRole
    );
    
    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (err) {
    console.error('[getTasksById] Error:', err.message);
    if (err.message === 'INVALID_TASK_ID') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid Task ID" });
    }
    if (err.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Task not found" });
    }
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ success: false, error: "ForbiddenError", message: "You are not a member of this project" });
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
    
    console.log('[createTask] Request:', { 
      projectId, 
      userId, 
      body: req.body 
    });

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
    
    // Ghi log hoạt động ngay sau khi tạo task thành công
    try {
        console.log('[createTask] Logging activity...');
        await logActivity({
            userId: userId,
            projectId: projectId,
            organizationId: currentOrgId,
            action: "CREATE_TASK",
            entityType: "Task",
            entityId: task._id,
            description: `created task "${task.title}"`,
            newData: task,
            metadata: { snapshot: task }
        });
    } catch (logError) {
        console.error("[createTask] Failed to log activity:", logError);
    }

    if (task.assigneeId && task.assigneeId.toString() !== userId.toString()) {
        await createNotification({
            userId: task.assigneeId, 
            type: 'TASK_ASSIGN',
            content: `You have been assigned to a new task: "${task.title}"`,
            metadata: {
                taskId: task._id,
                projectId: task.projectId
            }
        });
    }

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (err) {
    console.error('[createTask] Error:', err.message);
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
    console.log('[updateTask] Request:', { taskId: req.params.id, body: req.body, user: req.user._id });

    const oldTask = await Task.findById(req.params.id);
    const updatedTask = await taskService.updateTask(
      req.params.id,
      req.body,
      req.user
    );

    // Ghi log hoạt động khi update task
    try {
        console.log('[updateTask] Logging activity...');
        await logActivity({
            userId: req.user._id,
            projectId: updatedTask.projectId,
            organizationId: req.user.currentOrganizationId,
            action: "UPDATE_TASK",
            entityType: "Task",
            entityId: updatedTask._id,
            description: `updated task "${updatedTask.title}"`,
            oldData: oldTask ? oldTask.toObject() : null,
            newData: updatedTask.toObject()
        });
    } catch (logError) {
        console.error("[updateTask] Failed to log activity:", logError);
    }

    if (updatedTask && req.body.assigneeId) {
        const newAssigneeId = updatedTask.assigneeId?.toString();
        const oldAssigneeId = oldTask?.assigneeId?.toString();
        const actorId = req.user._id.toString();
        
        if (newAssigneeId && newAssigneeId !== oldAssigneeId && newAssigneeId !== actorId) {
             await createNotification({
                userId: newAssigneeId,
                type: 'TASK_ASSIGN',
                content: `You have been assigned to task: "${updatedTask.title}"`,
                metadata: {
                    taskId: updatedTask._id,
                    projectId: updatedTask.projectId
                }
            });
        }
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (err) {
    console.error('[updateTask] Error:', err.message);
    if (err.message === 'INVALID_TASK_ID') {
      return res.status(400).json({ success: false, message: "Invalid Task ID" });
    }
    if (err.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ success: false, message: "You are not a member of this project" });
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
    console.log('[updateTaskStatus] Request:', { taskId: req.params.id, status: req.body.status, user: req.user._id });

    const oldTask = await Task.findById(req.params.id); 
    const task = await taskService.updateTaskStatus(
      req.params.id,
      req.body.status,
      req.user
    );

    // Ghi log thay đổi trạng thái
    try {
        console.log('[updateTaskStatus] Logging activity...');
        await logActivity({
            userId: req.user._id,
            projectId: task.projectId,
            organizationId: req.user.currentOrganizationId,
            action: "UPDATE_TASK",
            entityType: "Task",
            entityId: task._id,
            description: `updated status to "${task.status}"`,
            oldData: oldTask ? oldTask.toObject() : null,
            newData: task.toObject()
        });
    } catch (logError) { console.error("[updateTaskStatus] Log Error:", logError); }

    res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      data: task,
    });
  } catch (err) {
    console.error('[updateTaskStatus] Error:', err.message);
    if (err.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ success: false, message: "You are not a member of this project" });
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
    
    const currentUser = {
      _id: req.user._id || req.user.id,
      id: req.user._id || req.user.id,
      role: req.user.role
    };

    console.log('[reorderTask] Request:', {
      taskId,
      newStatus,
      newPosition,
      currentUserId: currentUser._id
    });

    const reorderTask = await taskService.reorderTask(taskId, newStatus, newPosition, currentUser);

    try {
        console.log('[reorderTask] Logging activity...');
        await logActivity({
            userId: req.user._id,
            projectId: reorderTask.projectId,
            organizationId: req.user.currentOrganizationId,
            action: "REORDER_TASK",
            entityType: "Task",
            entityId: reorderTask._id,
            description: `reordered task "${reorderTask.title}"`,
            newData: reorderTask.toObject()
        });
    } catch (logError) {
        console.error("[reorderTask] Failed to log activity:", logError);
    }
    
    res.json({ 
      success: true, 
      message: "Task reordered successfully", 
      data: reorderTask 
    });
  } catch (err) {
    console.error('[reorderTask] Error:', err.message);
    
    if (err.message === 'MISSING_REQUIRED_FIELDS') {
      return res.status(400).json({ success: false, message: "Missing taskId or newPosition" });
    }
    if (err.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    if (err.message === 'UNAUTHORIZED_ACCESS') {
      return res.status(403).json({ success: false, message: "You can only reorder tasks assigned to you" });
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
    console.log('[deleteTask] Request:', { taskId: req.params.id, user: req.user._id });
    const deletedTask = await taskService.deleteTask(req.params.id, req.user);
    
    // Ghi log xóa task
    try {
        console.log('[deleteTask] Logging activity...');
        await logActivity({
            userId: req.user._id,
            projectId: deletedTask.projectId,
            organizationId: req.user.currentOrganizationId,
            action: "DELETE_TASK",
            entityType: "Task",
            entityId: deletedTask._id,
            description: `deleted task "${deletedTask.title}"`,
        });
    } catch (logError) { console.error("[deleteTask] Log Error:", logError); }

    res.status(200).json({
      success: true,
      message: "Task soft-deleted successfully",
      data: deletedTask,
    });
  } catch (err) {
    console.error('[deleteTask] Error:', err.message);
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
    console.log('[createSubtask] Request:', { taskId: req.params.taskId, body: req.body });
    const subtask = await taskService.createSubtask(req.params.taskId, req.body.title);
    try {
        console.log('[subTask] Logging activity...');
        await logActivity({
            userId: req.user._id,
            projectId: subtask.projectId,
            organizationId: req.user.currentOrganizationId,
            action: "CREATE_SUBTASK",
            entityType: "Task",
            entityId: subtask._id,
            description: `created subtask "${subtask.title}"`,
        });
    } catch (logError) { console.error("[deleteTask] Log Error:", logError); }
    res.status(201).json({
      success: true,
      message: "Subtask created successfully",
      data: subtask,
    });
  } catch (err) {
    console.error('[createSubtask] Error:', err.message);
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
    console.log('[toggleSubtask] Request:', { taskId: req.params.taskId, subtaskId: req.params.subtaskId, isCompleted: req.body.isCompleted });
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
    console.error('[toggleSubtask] Error:', err.message);
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
    console.log('[deleteSubtask] Request:', { taskId: req.params.taskId, subtaskId: req.params.subtaskId });
    const updatedTask = await taskService.deleteSubtask(req.params.taskId, req.params.subtaskId);
    res.status(200).json({ 
      success: true, 
      message: "Subtask deleted", 
      data: updatedTask 
    });
  } catch (err) {
    console.error('[deleteSubtask] Error:', err.message);
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
    console.log('[magicSubtasks] Request:', { taskId: req.params.taskId, user: req.user._id });
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
    console.error('[magicSubtasks] Error:', err.message);
    if (err.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

/**
 * @desc Add attachment to task
 * @route POST /tasks/:taskId/attachments
 * @access Private
 */
export const addAttachment = async (req, res) => {
  try {
    console.log('[addAttachment] Request:', { taskId: req.params.taskId, body: req.body });
    const { taskId } = req.params;
    const { name, url } = req.body;

    // Validate Input
    if (!name || !url) {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Attachment name and URL are required" 
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    task.attachments.push({ name, url });
    await task.save();

    const newAttachment = task.attachments[task.attachments.length - 1];

    res.status(201).json({ 
      success: true, 
      message: "Attachment added successfully", 
      data: newAttachment 
    });
  } catch (error) {
    console.error('[addAttachment] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Remove attachment from task
 * @route DELETE /tasks/:taskId/attachments/:attachmentId
 * @access Private
 */
export const removeAttachment = async (req, res) => {
  try {
    console.log('[removeAttachment] Request:', { taskId: req.params.taskId, attachmentId: req.params.attachmentId });
    const { taskId, attachmentId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    task.attachments.pull({ _id: attachmentId });
    await task.save();

    res.json({ success: true, message: "Attachment removed successfully" });
  } catch (error) {
    console.error('[removeAttachment] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};