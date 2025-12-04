import express from "express";
import {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from "../controllers/meeting.controller.js";
import { verifyToken, checkRole } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @route   GET /projects/:projectId/meetings
 * @desc    Get all meetings for a project
 * @access  Private
 */
router.get("/projects/:projectId/meetings", verifyToken, getMeetings);

/**
 * @route   GET /meetings/:id
 * @desc    Get single meeting details
 * @access  Private
 */
router.get("/meetings/:id", verifyToken, getMeeting);

/**
 * @route   POST /projects/:projectId/meetings
 * @desc    Create new meeting (with time conflict validation)
 * @access  Private (Admin/Manager)
 */
router.post(
  "/projects/:projectId/meetings",
  verifyToken,
  checkRole("Admin", "Manager"),
  createMeeting
);

/**
 * @route   PATCH /meetings/:id
 * @desc    Update meeting
 * @access  Private (Admin/Manager/Creator)
 */
router.patch("/meetings/:id", verifyToken, updateMeeting);

/**
 * @route   DELETE /meetings/:id
 * @desc    Delete meeting (soft delete)
 * @access  Private (Admin/Manager/Creator)
 */
router.delete("/meetings/:id", verifyToken, deleteMeeting);

export default router;
