import express from "express";
import { getDailyBrief } from "../controllers/ai.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @route   GET /ai/daily-brief
 * @desc    Get AI-generated daily summary
 * @access  Private
 */
router.get("/daily-brief", verifyToken, getDailyBrief);

export default router;