import express from "express";
import {
  getTasksByProject,
  getFilteredTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  reorderTask,
  createSubtask,
  toggleSubtask,
  deleteSubtask,
  getTasksById,
  magicSubtasks,
  addAttachment,
  removeAttachment
} from "../controllers/task.controller.js";
import { getLabels } from "../controllers/label.controller.js";
import { verifyToken, checkRole, requireOrgAccess } from "../middlewares/auth.js";
import { checkProjectActive } from "../middlewares/archive.middleware.js";

const router = express.Router();

/**
 * @route   GET /tasks
 * @desc    Filter tasks by project / assignee / status
 * @access  Private (Admin/Manager/Member)
 */
router.get("/tasks", verifyToken, getFilteredTasks);

/**
 * @route   GET /tasks/:id
 * @desc    Get task detail by ID
 * @access  Private (Admin/Manager/Member)
 */
router.get("/tasks/:id", verifyToken, getTasksById); 

/**
 * @route   GET /projects/:id/tasks
 * @desc    Get all tasks within a specific project (not deleted)
 * @access  Private (Admin/Manager/Member)
 */
router.get("/projects/:id/tasks", verifyToken, getTasksByProject);

/**
 * @route   POST /projects/:id/tasks
 * @desc    Create a new task in a project (Admin/Manager only)
 * @access  Private (Admin/Manager)
 */
router.post("/projects/:id/tasks", verifyToken, requireOrgAccess, checkRole("Admin", "Manager"), createTask);

router.patch('/tasks/reorder', verifyToken, requireOrgAccess, reorderTask);

/**
 * @route   PUT /tasks/:id
 * @desc    Update task details (title, assignee, etc.)
 * @access  Private (Admin/Manager/Member)
 */
router.put("/tasks/:id", verifyToken, requireOrgAccess, updateTask);

/**
 * @route   PATCH /tasks/:id
 * @desc    Update task status (TODO → DOING → DONE)
 * @access  Private (Admin/Manager/Member)
 */
router.patch("/tasks/:id", verifyToken, requireOrgAccess, updateTaskStatus);

/**
 * @route   DELETE /tasks/:id
 * @desc    Soft delete a task (mark as deletedAt)
 * @access  Private (Admin/Manager)
 */
router.delete("/tasks/:id", verifyToken, requireOrgAccess, checkRole("Admin", "Manager"), deleteTask);

/**
 * @route   POST /tasks/:taskId/subtasks
 * @desc    Create a subtask
 */
router.post("/tasks/:taskId/subtasks", verifyToken, requireOrgAccess, createSubtask);

/**
 * @route   PATCH /tasks/:taskId/subtasks/:subtaskId/toggle
 * @desc    Toggle subtask completion
 */
router.patch("/tasks/:taskId/subtasks/:subtaskId/toggle", verifyToken, requireOrgAccess, toggleSubtask);

/**
 * @route   DELETE /tasks/:taskId/subtasks/:subtaskId
 * @desc    Delete a subtask
 */
router.delete("/tasks/:taskId/subtasks/:subtaskId", verifyToken, requireOrgAccess, deleteSubtask);

/**
 * @route   POST /tasks/:taskId/magic-subtasks
 * @desc    Generate subtasks via AI Service
 * @access  Private
 */
router.post("/tasks/:taskId/magic-subtasks", verifyToken, requireOrgAccess, magicSubtasks);

/**
 * @route   GET /projects/:id/labels
 * @desc    Get all labels of a project
 * @access  Private
 */
router.get("/projects/:id/labels", verifyToken, requireOrgAccess, getLabels);

/**
 * @route   POST /tasks/:taskId/attachments
 * @desc    Add an attachment to task
 * @access  Private
 */
router.post("/tasks/:taskId/attachments", verifyToken, requireOrgAccess, addAttachment);

/**
 * @route   DELETE /tasks/:taskId/attachments/:attachmentId
 * @desc    Remove an attachment from task
 * @access  Private
 */
router.delete("/tasks/:taskId/attachments/:attachmentId", verifyToken, requireOrgAccess, removeAttachment);

export default router;