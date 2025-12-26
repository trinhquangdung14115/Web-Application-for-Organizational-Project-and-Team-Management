import express from "express";
import { createComment, getCommentsByTask } from "../controllers/comment.controller.js";
import { verifyToken, requireOrgAccess } from "../middlewares/auth.js";
import { requireProjectMember } from "../middlewares/project.auth.js";

const router = express.Router();

/**
 * @route   GET /tasks/:taskId/comments
 * @access  Private (Project Member)
 */
router.get("/tasks/:taskId/comments", verifyToken, requireOrgAccess, requireProjectMember, getCommentsByTask);

/**
 * @route   POST /tasks/:taskId/comments
 * @access  Private (Project Member)
 */
router.post("/tasks/:taskId/comments", verifyToken, requireOrgAccess, requireProjectMember, createComment);

export default router;