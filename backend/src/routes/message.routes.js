import express from "express";
import { verifyToken } from "../middlewares/auth.js"; 
import * as messageController from "../controllers/message.controller.js";

const router = express.Router();

/**
 * @route   GET /api/projects/:projectId/messages
 * @desc    Get list of messages in a project 
 * @access  Private (Admin or Active Project Members only)
 */
router.get("/projects/:projectId/messages", verifyToken, messageController.getProjectMessages);

export default router;