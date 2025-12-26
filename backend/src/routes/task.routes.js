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
import { verifyToken, requireOrgAccess } from "../middlewares/auth.js";
import { verifyProjectAccess, requireProjectMember, requireProjectManager } from "../middlewares/project.auth.js";
import { checkProjectActive } from "../middlewares/archive.middleware.js";

const router = express.Router();

/**
 * @route   GET /tasks
 * @desc    Filter tasks by project / assignee / status
 * @access  Private (Project Member)
 */
router.get("/tasks", verifyToken, requireOrgAccess, getFilteredTasks);

/**
 * @route   GET /tasks/:id
 * @desc    Get task detail by ID
 * @access  Private (Project Member)
 */
router.get("/tasks/:id", verifyToken, requireOrgAccess, requireProjectMember, getTasksById); 

/**
 * @route   GET /projects/:id/tasks
 * @desc    Get all tasks within a specific project (not deleted)
 * @access  Private (Project Member)
 */
router.get("/projects/:id/tasks", verifyToken, requireOrgAccess, requireProjectMember, getTasksByProject);

/**
 * @route   POST /projects/:id/tasks
 * @desc    Create a new task in a project (Project Manager/Admin only)
 * @access  Private (Project Admin/Manager)
 */
router.post("/projects/:id/tasks", verifyToken, requireOrgAccess, requireProjectManager, createTask);

router.patch('/tasks/reorder', verifyToken, requireOrgAccess, requireProjectMember, reorderTask);

/**
 * @route   PUT /tasks/:id
 * @desc    Update task details (title, assignee, etc.)
 * @access  Private (Project Member)
 */
router.put("/tasks/:id", verifyToken, requireOrgAccess, requireProjectMember, updateTask);

/**
 * @route   PATCH /tasks/:id
 * @desc    Update task status (TODO → DOING → DONE)
 * @access  Private (Project Member)
 */
router.patch("/tasks/:id", verifyToken, requireOrgAccess, requireProjectMember, updateTaskStatus);

/**
 * @route   DELETE /tasks/:id
 * @desc    Soft delete a task (mark as deletedAt)
 * @access  Private (Project Admin/Manager)
 */
router.delete("/tasks/:id", verifyToken, requireOrgAccess, requireProjectManager, deleteTask);

/**
 * @route   POST /tasks/:taskId/subtasks
 * @desc    Create a subtask
 * @access  Private (Project Member)
 */
router.post("/tasks/:taskId/subtasks", verifyToken, requireOrgAccess, requireProjectMember, createSubtask);

/**
 * @route   PATCH /tasks/:taskId/subtasks/:subtaskId/toggle
 * @desc    Toggle subtask completion
 * @access  Private (Project Member)
 */
router.patch("/tasks/:taskId/subtasks/:subtaskId/toggle", verifyToken, requireOrgAccess, requireProjectMember, toggleSubtask);

/**
 * @route   DELETE /tasks/:taskId/subtasks/:subtaskId
 * @desc    Delete a subtask
 * @access  Private (Project Member)
 */
router.delete("/tasks/:taskId/subtasks/:subtaskId", verifyToken, requireOrgAccess, requireProjectMember, deleteSubtask);

/**
 * @route   POST /tasks/:taskId/magic-subtasks
 * @desc    Generate subtasks via AI Service
 * @access  Private (Project Member)
 */
router.post("/tasks/:taskId/magic-subtasks", verifyToken, requireOrgAccess, requireProjectMember, magicSubtasks);

/**
 * @route   GET /projects/:id/labels
 * @desc    Get all labels of a project
 * @access  Private (Project Member)
 */
router.get("/projects/:id/labels", verifyToken, requireOrgAccess, requireProjectMember, getLabels);

/**
 * @route   POST /tasks/:taskId/attachments
 * @desc    Add an attachment to task
 * @access  Private (Project Member)
 */
router.post("/tasks/:taskId/attachments", verifyToken, requireOrgAccess, requireProjectMember, addAttachment);

/**
 * @route   DELETE /tasks/:taskId/attachments/:attachmentId
 * @desc    Remove an attachment from task
 * @access  Private (Project Member)
 */
router.delete("/tasks/:taskId/attachments/:attachmentId", verifyToken, requireOrgAccess, requireProjectMember, removeAttachment);

export default router;