import express from "express";
import { getNotifications, markAsRead } from "../controllers/notification.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @route   GET /notifications
 * @desc    Get user notifications (polling support)
 * @access  Private
 */
router.get("/notifications", verifyToken, getNotifications);

/**
 * @route   PATCH /notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.patch("/notifications/:id/read", verifyToken, markAsRead);

export default router;