import * as projectValidator from "../validators/project.validator.js";
import * as projectService from "../services/project.service.js";
import { createNotification } from "../services/notification.service.js";
import { emitForceLogoutProject } from "../services/socket.service.js";
import User from "../models/user.model.js"; 
import { signToken } from "../utils/jwt.js"; 
import ProjectMember from "../models/projectMember.model.js";
import Project from "../models/project.model.js";

// POST /projects
export const createProject = async (req, res) => {
  try {
    // Log request body và headers
    console.log('[CONTROLLER] req.body:', JSON.stringify(req.body, null, 2));
    console.log('[CONTROLLER] req.headers:', {
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'EXISTS' : 'MISSING'
    });

    const validation = projectValidator.validateCreateProject(req.body);

    console.log('[CONTROLLER] Validation result:', {
      isValid: validation.isValid,
      errors: validation.errors
    });

    if (!validation.isValid) {
      console.log('[CONTROLLER] Validation FAILED, returning 400');
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError",
        errors: validation.errors 
      });
    }

    const currentOrgId = req.user.currentOrganizationId;
    const userId = req.user._id;

    console.log('[CONTROLLER] User context:', {
      userId,
      currentOrgId,
      userRole: req.user.role
    });

    if (!currentOrgId) {
      console.log('[CONTROLLER] No organization context');
      return res.status(400).json({ 
        success: false, 
        message: "Organization context missing" 
      });
    }

    const project = await projectService.createProject(
      req.body,
      userId,
      currentOrgId
    );

    console.log('[CONTROLLER] Project created successfully:', project._id);
    res.status(201).json({ 
      success: true, 
      message: "Project created successfully", 
      data: project 
    });

  } catch (err) {
    console.error('[CONTROLLER] Error:', err.message);
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Organization is required" });
    }
    if (err.message === 'ORGANIZATION_NOT_FOUND') {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Organization not found" });
    }
    if (err.message === 'PLAN_LIMIT_REACHED') {
      return res.status(403).json({ success: false, error: "PlanLimitReached", message: "Free plan limit reached (Max 1 Project). Please upgrade to Premium." });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// GET /projects
export const listProjects = async (req, res) => {
  try {
    const currentOrgId = req.user.currentOrganizationId;
    const userId = req.user._id;
    const userRole = req.user.role;
    if (!currentOrgId) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const validation = projectValidator.validateProjectQuery(req.query);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError",
        errors: validation.errors 
      });
    }

    const filters = {
      ...req.query,
      organizationId: currentOrgId
    };

    const result = await projectService.listProjects(filters, userId, userRole);

    res.json({ 
      success: true, 
      count: result.projects.length,
      data: result.projects,
      pagination: result.pagination
    });
  } catch (err) {
    if (err.message === 'ORGANIZATION_ID_REQUIRED') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Organization ID is required" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// GET /projects/:id
export const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userSystemRole = req.user.role;
    const currentOrgId = req.user.currentOrganizationId;

    // Call service với đầy đủ params
    const projectData = await projectService.getProjectById(
      id, 
      userId, 
      userSystemRole, 
      currentOrgId
    );

    res.json({
      success: true,
      data: projectData
    });

  } catch (err) {
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID" });
    }
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Organization is required" });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }
    console.error('getProject error:', err);
    res.status(500).json({ 
      success: false, 
      error: "ServerError",
      message: err.message 
    });
  }
};

// PUT /projects/:id
export const updateProject = async (req, res) => {
  try {
    const validation = projectValidator.validateUpdateProject(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError",
        errors: validation.errors 
      });
    }

    const { id } = req.params;
    const userId = req.user._id;
    const currentOrgId = req.user.currentOrganizationId;

    const project = await projectService.updateProject(id, req.body, userId, currentOrgId);

    res.json({ 
      success: true, 
      message: "Project updated successfully", 
      data: project 
    });
  } catch (err) {
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID" });
    }
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Organization is required" });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// DELETE /projects/:id
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const currentOrgId = req.user.currentOrganizationId;

    const project = await projectService.deleteProject(id, userId, currentOrgId);

    res.json({ 
      success: true, 
      message: "Project deleted", 
      data: project 
    });
  } catch (err) {
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID" });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// GET /projects/:id/members
export const getProjectMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const currentOrgId = req.user.currentOrganizationId;

    const members = await projectService.getProjectMembers(id, currentOrgId);

    res.status(200).json({ success: true, data: members });
  } catch (err) {
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID" });
    }
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Organization is required" });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// PATCH /projects/:id/archive
export const toggleArchive = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const currentOrgId = req.user.currentOrganizationId;

    const project = await projectService.toggleArchive(id, userId, currentOrgId);

    res.json({ 
      success: true, 
      message: `Project ${project.status === 'archived' ? 'archived' : 'unarchived'} successfully`, 
      data: project 
    });
  } catch (err) {
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID" });
    }
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Organization is required" });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// GET /projects/:id/summary
export const getProjectSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const currentOrgId = req.user.currentOrganizationId;

    const summary = await projectService.getProjectSummary(id, currentOrgId);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    if (error.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID" });
    }
    if (error.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Organization is required" });
    }
    if (error.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: error.message });
  }
};

// GET /projects/:id/activities
export const getProjectActivities = async (req, res) => {
  try {
    const { id } = req.params;
    const currentOrgId = req.user.currentOrganizationId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await projectService.getProjectActivities(id, currentOrgId, page, limit);

    res.status(200).json({
      success: true,
      data: result.activities,
      pagination: result.pagination
    });
  } catch (error) {
    if (error.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID" });
    }
    if (error.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Organization is required" });
    }
    if (error.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: error.message });
  }
};

// GET /projects/pending-requests
export const getPendingRequests = async (req, res) => {
  try {
    const currentOrgId = req.user.currentOrganizationId;
    
    if (!currentOrgId) {
      return res.status(400).json({ 
        success: false, 
        message: "Organization context missing" 
      });
    }

    const pendingList = await projectService.getPendingRequests(currentOrgId);

    res.json({ success: true, data: pendingList });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: "ServerError",
      message: err.message 
    });
  }
};

// GET /projects/:id/invite-code
export const getInviteCode = async (req, res) => {
  try {
    const { id } = req.params;
    const currentOrgId = req.user.currentOrganizationId;

    const code = await projectService.getOrCreateInviteCode(id, currentOrgId);

    res.json({ success: true, code });
  } catch (err) {
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID" });
    }
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Organization is required" });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }
    if (err.message === 'FAILED_TO_GENERATE_CODE') {
      return res.status(500).json({ success: false, message: "Failed to generate unique code" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// PATCH /projects/:id/invite-code (Reset)
export const resetInviteCode = async (req, res) => {
  try {
    const { id } = req.params;
    const currentOrgId = req.user.currentOrganizationId;

    const newCode = await projectService.resetInviteCode(id, currentOrgId);

    res.json({ 
      success: true, 
      message: "Invite code reset successfully", 
      code: newCode 
    });
  } catch (err) {
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID" });
    }
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Organization is required" });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }
    if (err.message === 'FAILED_TO_RESET_CODE') {
      return res.status(500).json({ success: false, message: "Failed to reset invite code" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// POST /projects/join
export const joinProjectByCode = async (req, res) => {
  try {
    const validation = projectValidator.validateJoinByCode(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError",
        errors: validation.errors 
      });
    }

    const { inviteCode } = req.body;
    const userId = req.user._id;
    const currentOrganizationId = req.user.currentOrganizationId; 

    const projectId = await projectService.joinProjectByCode(
      inviteCode, 
      userId, 
      currentOrganizationId
    );

    const updatedUser = await User.findById(userId);

    const newToken = signToken({
      sub: updatedUser._id.toString(),
      email: updatedUser.email,
      role: updatedUser.role, 
      organizationId: updatedUser.currentOrganizationId.toString()
    });

    res.json({ 
      success: true, 
      message: "Successfully joined project", 
      projectId,
      data: {
        token: newToken,
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          currentOrganizationId: updatedUser.currentOrganizationId,
          organizations: updatedUser.organizations
        }
      }
    });

  } catch (err) {
    console.error("[JOIN_PROJECT] Error:", err.message);

    if (err.message === 'INVALID_INVITE_CODE') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid invite code format" });
    }
    if (err.message === 'INVALID_OR_EXPIRED_CODE') {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Invalid or expired invite code" });
    }
    if (err.message === 'PROJECT_ARCHIVED') {
      return res.status(403).json({ success: false, error: "ForbiddenError", message: "This project has been archived and cannot accept new members" });
    }
    if (err.message === 'ALREADY_REQUESTED') {
      return res.status(409).json({ success: false, error: "ConflictError", message: "You already requested to join this project" });
    }
    if (err.message === 'ALREADY_MEMBER') {
      return res.status(409).json({ success: false, error: "ConflictError", message: "You are already a member of this project" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message || "Failed to join project" });
  }
};

// POST /projects/:id/members
export const addMember = async (req, res) => {
  try {
    const { id } = req.params; 
    const { userId: targetUserId, role } = req.body; 
    const currentOrgId = req.user.currentOrganizationId;

    if (!targetUserId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const project = await projectService.addMember(id, targetUserId, role, currentOrgId);

    if (targetUserId.toString() !== req.user._id.toString()) {
        await createNotification({
            userId: targetUserId, 
            type: 'PROJECT_ADD',
            content: `You have been added to project: "${project.name}" as ${role || 'Member'}`,
            metadata: {
                projectId: project._id,
                projectName: project.name
            }
        });
    }

    res.status(200).json({ 
      success: true, 
      message: "Member added successfully", 
      data: project 
    });

  } catch (err) {
    if (err.message === 'USER_ALREADY_MEMBER') {
        return res.status(409).json({ success: false, message: "User is already a member of this project" });
    }
    if (err.message === 'USER_NOT_BELONG_TO_ORGANIZATION') {
        return res.status(403).json({ success: false, message: "User does not belong to this organization" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// DELETE /projects/:id/members/:memberId
export const removeProjectMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const currentOrgId = req.user.currentOrganizationId;
    const requestorId = req.user._id;
    
    // Get project info before removal for socket event
    const project = await Project.findById(id).select('name');
    
    await projectService.removeMember(id, memberId, requestorId, currentOrgId);

    // Emit socket event to force logout the removed user from this project
    if (project) {
      emitForceLogoutProject(memberId, id, project.name);
    }

    res.json({ success: true, message: "Member removed successfully" });
  } catch (err) {
    if (err.message === 'FORBIDDEN_PROJECT_ACTION') {
         return res.status(403).json({ success: false, message: "Forbidden: You don't have permission to remove members" });
    }
    if (err.message === 'CANNOT_REMOVE_CREATOR') {
         return res.status(400).json({ success: false, message: "Cannot remove project creator/owner" });
    }
    if (err.message === 'INSUFFICIENT_PERMISSIONS') {
         return res.status(403).json({ success: false, message: "Insufficient permissions: Cannot remove member with equal or higher role" });
    }
    if (err.message === 'CANNOT_REMOVE_SELF') {
         return res.status(400).json({ success: false, message: "Cannot remove yourself from project" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /projects/:id/members/:userId
export const updateMemberRole = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body; 
    const currentOrgId = req.user.currentOrganizationId;
    const requestorId = req.user._id;

    const hasPermission = await projectService.checkProjectPermission(id, requestorId, currentOrgId);
    if (!hasPermission) {
        return res.status(403).json({ success: false, message: "Forbidden: You don't have permission" });
    }

    const updatedMember = await ProjectMember.findOneAndUpdate(
        { projectId: id, userId: userId },
        { roleInProject: role },
        { new: true }
    );

    if (!updatedMember) {
        return res.status(404).json({ success: false, message: "Member not found in project" });
    }

    res.json({ success: true, message: "Role updated successfully", data: updatedMember });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /projects/:id/report/attendance
export const exportAttendanceReport = async (req, res) => {
  try {
    const { id } = req.params; 
    const { month, year } = req.query;
    const currentOrgId = req.user.currentOrganizationId;
    if (!month || !year) {
      return res.status(400).json({ 
        success: false, 
        message: "Month and Year are required params" 
      });
    }
    const csvData = await projectService.exportAttendanceCSV(id, parseInt(month), parseInt(year), currentOrgId);
    const filename = `attendance_report_project_${id}_${month}_${year}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(200).send(csvData);

  } catch (err) {
    console.error("Export Error:", err);
    res.status(500).json({ 
      success: false, 
      error: "ServerError", 
      message: "Could not export report" 
    });
  }
};