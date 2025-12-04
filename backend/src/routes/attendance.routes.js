import express from "express";
import {
  checkIn,
  getMyAttendanceToday,
  getProjectAttendance,
  getMyAttendance,
} from "../controllers/attendance.controller.js";
import { verifyToken, checkRole } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @route   POST /projects/:projectId/attendance/checkin
 * @desc    Check-in attendance for a project
 * @access  Private
 */
router.post("/projects/:projectId/attendance/checkin", verifyToken, checkIn);

/**
 * @route   GET /projects/:projectId/attendance/me
 * @desc    Get my attendance status for today
 * @access  Private
 */
router.get(
  "/projects/:projectId/attendance/me",
  verifyToken,
  getMyAttendanceToday
);

/**
 * @route   GET /projects/:projectId/attendance
 * @desc    Get attendance history for a project (Admin/Manager only)
 * @access  Private (Admin/Manager)
 */
router.get(
  "/projects/:projectId/attendance",
  verifyToken,
  checkRole("Admin", "Manager"),
  getProjectAttendance
);

/**
 * @route   GET /attendance/me
 * @desc    Get my attendance history across all projects
 * @access  Private
 */
router.get("/attendance/me", verifyToken, getMyAttendance);

export default router;
