import Message from "../models/message.model.js";
import ProjectMember from "../models/projectMember.model.js";

// GET /api/projects/:projectId/messages
export const getProjectMessages = async (req, res) => {
  try {
    const { projectId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 150; 
    const skip = (page - 1) * limit;
    
    const userId = req.user._id;
    const userRole = req.user.role; 

    if (userRole !== 'Admin') {
        const member = await ProjectMember.findOne({
            projectId,
            userId,
            status: 'ACTIVE' 
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                error: "ForbiddenError",
                message: "You are not an active member of this project"
            });
        }
    }

    const messages = await Message.find({ projectId })
        .sort({ createdAt: -1 }) 
        .skip(skip)
        .limit(limit)
        .populate("senderId", "name email avatar");

    const reversedMessages = messages.reverse();

    return res.status(200).json({
        success: true,
        count: reversedMessages.length,
        data: reversedMessages,
        pagination: {
            page,
            limit
        }
    });

  } catch (error) {
    console.error("Get Messages Error:", error);
    return res.status(500).json({
        success: false,
        error: "ServerError",
        message: error.message
    });
  }
};