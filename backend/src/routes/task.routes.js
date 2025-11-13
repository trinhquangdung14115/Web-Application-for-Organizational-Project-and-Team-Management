import express from "express";
import {
  getTasksByProject,
  getFilteredTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from "../controllers/task.controller.js";
import { verifyToken, checkRole } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @route   GET /tasks
 * @desc    Lọc task theo project / assignee / status
 * @access  Private (Admin/Manager/Member)
 * @example /api/tasks?project=...&assignee=...&status=TODO
 */
router.get("/tasks", verifyToken, getFilteredTasks);

/**
 * @route   GET /projects/:id/tasks
 * @desc    Lấy danh sách task trong 1 project (chưa bị xóa)
 * @access  Private (Admin/Manager/Member)
 */
router.get("/projects/:id/tasks", verifyToken, getTasksByProject);

/**
 * @route   POST /projects/:id/tasks
 * @desc    Tạo task mới trong project (chỉ Admin/Manager)
 * @access  Private (Admin/Manager)
 */
router.post("/projects/:id/tasks", verifyToken, checkRole("Admin", "Manager"), createTask);

/**
 * @route   PUT /tasks/:id
 * @desc    Cập nhật thông tin task (title, assignee,...)
 * @access  Private (Admin/Manager/Member)
 */
router.put("/tasks/:id", verifyToken, updateTask);

/**
 * @route   PATCH /tasks/:id
 * @desc    Cập nhật trạng thái task (TODO → DOING → DONE)
 * @access  Private (Admin/Manager/Member)
 */
router.patch("/tasks/:id", verifyToken, updateTaskStatus);

/**
 * @route   DELETE /tasks/:id
 * @desc    Xóa mềm 1 task (đánh dấu deletedAt)
 * @access  Private (Admin/Manager)
 */
router.delete("/tasks/:id", verifyToken, checkRole("Admin", "Manager"), deleteTask);

export default router;
