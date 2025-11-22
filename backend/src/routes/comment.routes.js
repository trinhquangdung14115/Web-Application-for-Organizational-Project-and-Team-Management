import express from "express";
import { createComment, getCommentsByTask } from "../controllers/comment.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @route   GET /tasks/:taskId/comments
 * @access  Private
 */
router.get("/tasks/:taskId/comments", verifyToken, getCommentsByTask);

/**
 * @route   POST /tasks/:taskId/comments
 * @access  Private
 */
router.post("/tasks/:taskId/comments", verifyToken, createComment);

export default router;