import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import ProjectMember from "../models/projectMember.model.js";
/**
 * Middleware kiểm tra dự án có đang Active không.
 * Nếu Project status là "ARCHIVED" -> Chặn request (403).
 */
export const checkProjectActive = async (req, res, next) => {
  try {
    let projectId = req.params.projectId || req.params.id;
    const taskId = req.params.taskId || (req.params.id && req.originalUrl.includes("/tasks/"));

    // Trường hợp 1: Gọi API liên quan đến Task (VD: PATCH /tasks/:id)
    // Cần tìm ProjectId thông qua Task
    if (!projectId && taskId) {
      const task = await Task.findById(taskId).select("projectId");
      if (task) {
        projectId = task.projectId;
      }
    }

    // Trường hợp 2: Nếu vẫn không có projectId (VD: tạo project mới), bỏ qua check
    if (!projectId) {
      return next();
    }

    // Tìm Project
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found to check status." 
      });
    }

    // CHECK Nếu Archived -> Chặn
    if (project.status === "ARCHIVED") {
      return res.status(403).json({
        success: false,
        message: `Project "${project.name}" is archived. Actions are restricted.`,
      });
    }

    // Lưu project vào request để controller sau có thể dùng luôn (đỡ query lại)
    req.project = project;
    next();

  } catch (error) {
    console.error("Check Project Active Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error checking project status." 
    });
  }
};
/**
 * Middleware check quyền nội bộ trong Project
 * @param {Array} allowedRoles 
 */
export const requireProjectRole = (allowedRoles = []) => async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userSystemRole = req.user.role; // Role hệ thống (lấy từ JWT)
    
    // Tìm projectId từ params hoặc body
    const projectId = req.params.projectId || req.params.id || req.body.projectId;

    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    // 1. System Admin luôn có quyền tối cao (Bỏ qua check nội bộ)
    if (userSystemRole === "Admin") return next();

    // 2. Tìm xem user này có trong project không
    const memberRecord = await ProjectMember.findOne({ 
      projectId, 
      userId, 
      status: "ACTIVE" 
    });

    if (!memberRecord) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. You are not a member of this project." 
      });
    }

    // 3. Check xem role trong project có khớp yêu cầu không
    if (allowedRoles.length > 0 && !allowedRoles.includes(memberRecord.roleInProject)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. This action requires project role: ${allowedRoles.join(", ")}` 
      });
    }

    next();
  } catch (error) {
    console.error("Check Project Role Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};