import express from "express";
import {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from "../controllers/meeting.controller.js";
import { verifyToken, checkRole, requireOrgAccess } from "../middlewares/auth.js";
import { requireProjectMember, requireProjectManager } from "../middlewares/project.auth.js";

const router = express.Router();

/**
 * @route   GET /projects/:projectId/meetings
 * @desc    Get all meetings for a project
 * @access  Private (Project Member)
 */
router.get("/projects/:projectId/meetings", verifyToken, requireOrgAccess, requireProjectMember, getMeetings);

/**
 * @route   GET /meetings/:id
 * @desc    Get single meeting details
 * @access  Private (Project Member)
 */
router.get("/meetings/:id", verifyToken, requireOrgAccess, requireProjectMember, getMeeting);

/**
 * @route   POST /projects/:projectId/meetings
 * @desc    Create new meeting (with time conflict validation)
 * @access  Private (Project Manager/Admin)
 */
router.post(
  "/projects/:projectId/meetings",
  verifyToken,
  requireOrgAccess,
  requireProjectManager,
  createMeeting
);

/**
 * @route   PATCH /meetings/:id
 * @desc    Update meeting
 * @access  Private (Project Manager/Admin)
 */
router.patch("/meetings/:id", verifyToken, requireOrgAccess, requireProjectManager, updateMeeting);

/**
 * @route   DELETE /meetings/:id
 * @desc    Delete meeting (soft delete)
 * @access  Private (Project Manager/Admin)
 */
router.delete("/meetings/:id", verifyToken, requireOrgAccess, requireProjectManager, deleteMeeting);

export default router;
