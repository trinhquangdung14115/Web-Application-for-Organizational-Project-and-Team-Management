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
  toggleSubtask, // Imported new controller
  deleteSubtask,  // Imported new controller
  getTasksById,
  magicSubtasks
} from "../controllers/task.controller.js";
import { verifyToken, checkRole } from "../middlewares/auth.js";
import { checkProjectActive } from "../middlewares/archive.middleware.js";

const router = express.Router();

/**
 * @route   GET /tasks
 * @desc    Filter tasks by project / assignee / status
 * @access  Private (Admin/Manager/Member)
 */
router.get("/tasks", verifyToken, getFilteredTasks);

// lấy chi tiết 1 task theo id
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
router.post("/projects/:id/tasks", verifyToken, checkRole("Admin", "Manager"), createTask);

router.patch('/tasks/reorder', reorderTask);

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

/**
 * @route   POST /tasks/:taskId/magic-subtasks
 * @desc    Generate subtasks via AI Service
 * @access  Private
 */
router.post("/tasks/:taskId/magic-subtasks", verifyToken, magicSubtasks);

export default router;