import Task from "../models/task.model.js";
import Meeting from "../models/meeting.model.js"; // Import Meeting Model
import AIService from "../services/ai.service.js";
import mongoose from "mongoose";

/**
 * @desc    Get AI-generated daily summary based on user's tasks and meetings
 * @route   GET /ai/daily-brief
 * @access  Private
 */
export const getDailyBrief = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
        assigneeId: new mongoose.Types.ObjectId(userId),
        status: { $nin: ["DONE", "BACKLOG"] }, 
        $or: [
            { dueDate: { $gte: startOfDay, $lte: endOfDay } }, // Due today
            { dueDate: { $lt: startOfDay } }
        ],
        deletedAt: null
    }).select("title status priority dueDate labels");

    const meetings = await Meeting.find({
        attendees: new mongoose.Types.ObjectId(userId), // User phải là người tham dự
        startTime: { $gte: startOfDay, $lte: endOfDay },
        deletedAt: null
    }).select("title startTime endTime location");

    const simplifiedTasks = tasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        labels: t.labels
    }));

    const simplifiedMeetings = meetings.map(m => ({
        title: m.title,
        time: new Date(m.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        location: m.location
    }));

    const brief = await AIService.summarizeDay(simplifiedTasks, simplifiedMeetings);

    res.status(200).json({
        success: true,
        data: brief 
    });

  } catch (error) {
    console.error("AI Daily Brief Controller Error:", error.message);
    res.status(500).json({ success: false, message: "Could not generate daily brief." });
  }
};