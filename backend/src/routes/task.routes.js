import express from "express";
import {
  getTasksByProject,
  getFilteredTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  createSubtask,
  toggleSubtask, // Imported new controller
  deleteSubtask  // Imported new controller
} from "../controllers/task.controller.js";
import { verifyToken, checkRole } from "../middlewares/auth.js";
import { checkProjectActive } from "../middlewares/project.middlewares.js";

const router = express.Router();

/**
 * @route   GET /tasks
 * @desc    Filter tasks by project / assignee / status
 * @access  Private (Admin/Manager/Member)
 */
router.get("/tasks", verifyToken, getFilteredTasks);

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
router.post("/projects/:id/tasks", verifyToken, checkRole("Admin", "Manager"), checkProjectActive, createTask);

/**
 * @route   PUT /tasks/:id
 * @desc    Update task details (title, assignee, etc.)
 * @access  Private (Admin/Manager/Member)
 */
router.put("/tasks/:id", verifyToken, checkProjectActive, updateTask);

/**
 * @route   PATCH /tasks/:id
 * @desc    Update task status (TODO → DOING → DONE)
 * @access  Private (Admin/Manager/Member)
 */
router.patch("/tasks/:id", verifyToken, updateTaskStatus);

/**
 * @route   DELETE /tasks/:id
 * @desc    Soft delete a task (mark as deletedAt)
 * @access  Private (Admin/Manager)
 */
router.delete("/tasks/:id", verifyToken, checkRole("Admin", "Manager"), checkProjectActive, deleteTask);

/**
 * @route   POST /tasks/:taskId/subtasks
 * @desc    Add subtask (embedded)
 * @access  Private
 */
router.post("/tasks/:taskId/subtasks", verifyToken, createSubtask);

/**
 * @route   PATCH /tasks/:taskId/subtasks/:subtaskId
 * @desc    Toggle subtask completion status
 * @access  Private
 */
router.patch("/tasks/:taskId/subtasks/:subtaskId", verifyToken, toggleSubtask);

/**
 * @route   DELETE /tasks/:taskId/subtasks/:subtaskId
 * @desc    Delete subtask
 * @access  Private
 */
router.delete("/tasks/:taskId/subtasks/:subtaskId", verifyToken, deleteSubtask);

export default router;