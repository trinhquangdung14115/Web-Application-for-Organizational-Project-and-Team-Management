import * as projectValidator from "../validators/project.validator.js";
import * as projectService from "../services/project.service.js";

// POST /projects
export const createProject = async (req, res) => {
  try {
    // 1. Validate input
    const validation = projectValidator.validateCreateProject(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError",
        errors: validation.errors 
      });
    }

    const currentOrgId = req.user.currentOrganizationId;
    const userId = req.user._id;

    if (!currentOrgId) {
      return res.status(400).json({ 
        success: false, 
        message: "Organization context missing" 
      });
    }

    // 2. Call service
    const project = await projectService.createProject(
      req.body,
      userId,
      currentOrgId
    );

    res.status(201).json({ 
      success: true, 
      message: "Project created successfully", 
      data: project 
    });

  } catch (err) {
    // Handle service errors
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Organization is required" 
      });
    }
    if (err.message === 'ORGANIZATION_NOT_FOUND') {
      return res.status(404).json({ 
        success: false, 
        error: "NotFoundError", 
        message: "Organization not found" 
      });
    }
    if (err.message === 'PLAN_LIMIT_REACHED') {
      return res.status(403).json({ 
        success: false, 
        error: "PlanLimitReached", 
        message: "Free plan limit reached (Max 1 Project). Please upgrade to Premium." 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: "ServerError", 
      message: err.message 
    });
  }
};

// GET /projects
export const listProjects = async (req, res) => {
  try {
    const currentOrgId = req.user.currentOrganizationId;
    if (!currentOrgId) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Validate query parameters
    const validation = projectValidator.validateProjectQuery(req.query);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError",
        errors: validation.errors 
      });
    }

    // Call service with filters
    const filters = {
      ...req.query,
      organizationId: currentOrgId
    };

    const result = await projectService.listProjects(filters);

    res.json({ 
      success: true, 
      count: result.projects.length,
      data: result.projects,
      pagination: result.pagination
    });
  } catch (err) {
    if (err.message === 'ORGANIZATION_ID_REQUIRED') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Organization ID is required" 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: "ServerError", 
      message: err.message 
    });
  }
};

// GET /projects/:id
export const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const currentOrgId = req.user.currentOrganizationId;

    // Call service
    const project = await projectService.getProjectById(id, currentOrgId);

    res.json({ success: true, data: project });
  } catch (err) {
    // Handle service errors
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Invalid project ID" 
      });
    }
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Organization is required" 
      });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ 
        success: false, 
        error: "NotFoundError", 
        message: "Project not found" 
      });
    }
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
    // 1. Validate input
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

    // 2. Call service
    const project = await projectService.updateProject(id, req.body, userId, currentOrgId);

    res.json({ 
      success: true, 
      message: "Project updated successfully", 
      data: project 
    });
  } catch (err) {
    // Handle service errors
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Invalid project ID" 
      });
    }
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Organization is required" 
      });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ 
        success: false, 
        error: "NotFoundError", 
        message: "Project not found" 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: "ServerError", 
      message: err.message 
    });
  }
};

// DELETE /projects/:id
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const currentOrgId = req.user.currentOrganizationId;

    // Call service
    const project = await projectService.deleteProject(id, userId, currentOrgId);

    res.json({ 
      success: true, 
      message: "Project deleted", 
      data: project 
    });
  } catch (err) {
    // Handle service errors
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Invalid project ID" 
      });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ 
        success: false, 
        error: "NotFoundError", 
        message: "Project not found" 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: "ServerError", 
      message: err.message 
    });
  }
};

// GET /projects/:id/members
export const getProjectMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const currentOrgId = req.user.currentOrganizationId;

    // Call service
    const members = await projectService.getProjectMembers(id, currentOrgId);

    res.status(200).json({ success: true, data: members });
  } catch (err) {
    // Handle service errors
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Invalid project ID" 
      });
    }
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Organization is required" 
      });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ 
        success: false, 
        error: "NotFoundError", 
        message: "Project not found" 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: "ServerError", 
      message: err.message 
    });
  }
};

// PATCH /projects/:id/archive
export const toggleArchive = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const currentOrgId = req.user.currentOrganizationId;

    // Call service
    const project = await projectService.toggleArchive(id, userId, currentOrgId);

    res.json({ 
      success: true, 
      message: `Project ${project.status === 'archived' ? 'archived' : 'unarchived'} successfully`, 
      data: project 
    });
  } catch (err) {
    // Handle service errors
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Invalid project ID" 
      });
    }
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Organization is required" 
      });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ 
        success: false, 
        error: "NotFoundError", 
        message: "Project not found" 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: "ServerError", 
      message: err.message 
    });
  }
};

// GET /projects/:id/summary
export const getProjectSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const currentOrgId = req.user.currentOrganizationId;

    // Call service
    const summary = await projectService.getProjectSummary(id, currentOrgId);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    // Handle service errors
    if (error.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Invalid project ID" 
      });
    }
    if (error.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Organization is required" 
      });
    }
    if (error.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ 
        success: false, 
        error: "NotFoundError", 
        message: "Project not found" 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: "ServerError", 
      message: error.message 
    });
  }
};

// GET /projects/:id/activities
export const getProjectActivities = async (req, res) => {
  try {
    const { id } = req.params;
    const currentOrgId = req.user.currentOrganizationId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Call service
    const result = await projectService.getProjectActivities(id, currentOrgId, page, limit);

    res.status(200).json({
      success: true,
      data: result.activities,
      pagination: result.pagination
    });
  } catch (error) {
    // Handle service errors
    if (error.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Invalid project ID" 
      });
    }
    if (error.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Organization is required" 
      });
    }
    if (error.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ 
        success: false, 
        error: "NotFoundError", 
        message: "Project not found" 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: "ServerError", 
      message: error.message 
    });
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

    // Call service with organizationId
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

    // Call service
    const code = await projectService.getOrCreateInviteCode(id, currentOrgId);

    res.json({ success: true, code });
  } catch (err) {
    // Handle service errors
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Invalid project ID" 
      });
    }
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Organization is required" 
      });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ 
        success: false, 
        error: "NotFoundError", 
        message: "Project not found" 
      });
    }
    if (err.message === 'FAILED_TO_GENERATE_CODE') {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to generate unique code" 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: "ServerError",
      message: err.message 
    });
  }
};

// PATCH /projects/:id/invite-code (Reset)
export const resetInviteCode = async (req, res) => {
  try {
    const { id } = req.params;
    const currentOrgId = req.user.currentOrganizationId;

    // Call service
    const newCode = await projectService.resetInviteCode(id, currentOrgId);

    res.json({ 
      success: true, 
      message: "Invite code reset successfully", 
      code: newCode 
    });
  } catch (err) {
    // Handle service errors
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Invalid project ID" 
      });
    }
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Organization is required" 
      });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ 
        success: false, 
        error: "NotFoundError", 
        message: "Project not found" 
      });
    }
    if (err.message === 'FAILED_TO_RESET_CODE') {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to reset invite code" 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: "ServerError",
      message: err.message 
    });
  }
};

// POST /projects/join
export const joinProjectByCode = async (req, res) => {
  try {
    // 1. Validate input
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
    //const currentOrgId = req.user.currentOrganizationId;

    // 2. Call service
    const projectId = await projectService.joinProjectByCode(inviteCode, userId, null);

    res.json({ 
      success: true, 
      message: "Successfully joined project", 
      projectId 
    });

  } catch (err) {
    // Handle service errors
    if (err.message === 'INVALID_INVITE_CODE') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError",
        message: "Invalid invite code format" 
      });
    }
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Organization is required" 
      });
    }
    if (err.message === 'INVALID_OR_EXPIRED_CODE') {
      return res.status(404).json({ 
        success: false, 
        message: "Invalid or expired invite code" 
      });
    }
    if (err.message === 'ALREADY_REQUESTED') {
      return res.status(400).json({ 
        success: false,
        message: "You already requested to join this project" 
      });
    }
    if (err.message === 'ALREADY_MEMBER') {
      return res.status(400).json({ 
        success: false,
        message: "You are already a member of this project" 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: "ServerError",
      message: err.message 
    });
  }
};