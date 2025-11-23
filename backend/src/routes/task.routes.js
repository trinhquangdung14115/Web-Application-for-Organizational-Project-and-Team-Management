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
router.post("/projects/:id/tasks", verifyToken, checkRole("Admin", "Manager"), createTask);

/**
 * @route   PUT /tasks/:id
 * @desc    Update task details (title, assignee, etc.)
 * @access  Private (Admin/Manager/Member)
 */
router.put("/tasks/:id", verifyToken, updateTask);

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
router.delete("/tasks/:id", verifyToken, checkRole("Admin", "Manager"), deleteTask);

export default router;