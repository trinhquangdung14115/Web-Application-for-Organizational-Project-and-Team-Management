/**
 * Project Service Layer
 * Business logic for project management
 */

import mongoose from "mongoose";
import Project from "../models/project.model.js";
import ProjectMember from "../models/projectMember.model.js";
import OrganizationMember from "../models/organizationMember.model.js";
import User from "../models/user.model.js";
import Task from "../models/task.model.js";
import ActivityLog from "../models/activityLog.model.js";
import Organization from "../models/organization.model.js";

/**
 * Generate random project code
 */
const generateRandomCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Create new project
 */
export const createProject = async (projectData, creatorId, currentOrganizationId) => {
  const { name, description, deadline } = projectData;

  // Validate organization exists
  if (!currentOrganizationId) {
    throw new Error('ORGANIZATION_REQUIRED');
  }

  // Check Organization Plan & Limits
  const organization = await Organization.findById(currentOrganizationId);
  if (!organization) {
    throw new Error('ORGANIZATION_NOT_FOUND');
  }

  if (organization.plan === "FREE") {
    const projectCount = await Project.countDocuments({ 
      organizationId: currentOrganizationId,
      deletedAt: null 
    });
    
    if (projectCount >= 1) {
      throw new Error('PLAN_LIMIT_REACHED');
    }
  }

  // Use transaction for atomic operation
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create Project
    const [project] = await Project.create([{
      name: name.trim(),
      description: description?.trim() || "",
      organizationId: currentOrganizationId,
      deadline: deadline || null,
      createdBy: creatorId,
    }], { session });

    // Add Creator as Admin in ProjectMember
    await ProjectMember.create([{
      projectId: project._id,
      userId: creatorId,
      roleInProject: "Admin",
      status: "ACTIVE"
    }], { session });

    // Log activity
    try {
      await ActivityLog.create([{
        projectId: project._id,
        userId: creatorId,
        action: "CREATE_PROJECT",
        content: `created project "${name}"`,
      }], { session });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }

    await session.commitTransaction();
    return project;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get all projects (with filters)
 */
export const listProjects = async (filters = {}) => {
  // organizationId is required
  if (!filters.organizationId) {
    throw new Error('ORGANIZATION_ID_REQUIRED');
  }

  const query = { 
    deletedAt: null,
    organizationId: filters.organizationId
  };

  // Apply other filters
  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.archived !== undefined) {
    query.isArchived = filters.archived === 'true';
  }

  // Pagination
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const skip = (page - 1) * limit;

  const projects = await Project.find(query)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Project.countDocuments(query);

  return {
    projects,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single project by ID
 */
export const getProjectById = async (projectId, currentOrganizationId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  if (!currentOrganizationId) {
    throw new Error('ORGANIZATION_REQUIRED');
  }

  const project = await Project.findOne({
    _id: projectId,
    organizationId: currentOrganizationId,
    deletedAt: null
  })
    .populate('createdBy', 'name email')
    //.populate('members.user', 'name email role avatar');

  if (!project) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  return project;
};

/**
 * Update project
 */
export const updateProject = async (projectId, updateData, userId, currentOrganizationId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  if (!currentOrganizationId) {
    throw new Error('ORGANIZATION_REQUIRED');
  }

  const project = await Project.findOne({
    _id: projectId,
    organizationId: currentOrganizationId,
    deletedAt: null
  });

  if (!project) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  // Update fields
  if (updateData.name) project.name = updateData.name.trim();
  if (updateData.description !== undefined) project.description = updateData.description.trim();
  if (updateData.startDate !== undefined) project.startDate = updateData.startDate;
  if (updateData.endDate !== undefined) project.endDate = updateData.endDate;
  if (updateData.deadline !== undefined) project.deadline = updateData.deadline;
  if (updateData.status) project.status = updateData.status;

  await project.save();

  // Log activity
  try {
    await ActivityLog.create({
      projectId: project._id,
      userId,
      action: "UPDATE_PROJECT",
      description: `Updated project "${project.name}"`,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }

  return project;
};

/**
 * Delete project (soft delete)
 */
export const deleteProject = async (projectId, userId, currentOrganizationId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  if (!currentOrganizationId) {
    throw new Error('ORGANIZATION_REQUIRED');
  }

  const project = await Project.findOne({
    _id: projectId,
    organizationId: currentOrganizationId,
    deletedAt: null
  });

  if (!project) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  project.deletedAt = new Date();
  await project.save();

  // Log activity
  try {
    await ActivityLog.create({
      projectId: project._id,
      userId,
      action: "DELETE_PROJECT",
      description: `Deleted project "${project.name}"`,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }

  return project;
};

/**
 * Toggle project archive status
 */
export const toggleArchive = async (projectId, userId, currentOrganizationId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  if (!currentOrganizationId) {
    throw new Error('ORGANIZATION_REQUIRED');
  }

  const project = await Project.findOne({
    _id: projectId,
    organizationId: currentOrganizationId,
    deletedAt: null
  });

  if (!project) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  // Toggle between 'active' and 'archived'
  project.status = project.status === 'active' ? 'archived' : 'active';
  await project.save();

  // Log activity
  const action = project.status === 'archived' ? "ARCHIVE_PROJECT" : "UNARCHIVE_PROJECT";
  try {
    await ActivityLog.create({
      projectId: project._id,
      userId,
      action,
      description: `${project.status === 'archived' ? 'Archived' : 'Unarchived'} project "${project.name}"`,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }

  return project;
};

/**
 * Add member to project
 */
export const addMember = async (projectId, userId, role = "Member", currentOrganizationId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new Error('INVALID_USER_ID');
  }

  if (!currentOrganizationId) {
    throw new Error('ORGANIZATION_REQUIRED');
  }

  const project = await Project.findOne({
    _id: projectId,
    organizationId: currentOrganizationId,
    deletedAt: null
  });

  if (!project) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  // Check if user already exists in ProjectMember
  const existingMember = await ProjectMember.findOne({
    projectId,
    userId
  });

  if (existingMember) {
    throw new Error('USER_ALREADY_MEMBER');
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user.organizations.includes(currentOrganizationId)) {
    throw new Error('USER_NOT_BELONG_TO_ORGANIZATION');
}

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // Add member to ProjectMember table
  await ProjectMember.create({
    projectId,
    userId,
    roleInProject: role,
    status: "ACTIVE"
  });

  return project;
};

/**
 * Remove member from project
 */
export const removeMember = async (projectId, userId, currentOrganizationId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new Error('INVALID_USER_ID');
  }

  if (!currentOrganizationId) {
    throw new Error('ORGANIZATION_REQUIRED');
  }

  const project = await Project.findOne({
    _id: projectId,
    organizationId: currentOrganizationId,
    deletedAt: null
  });

  if (!project) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  // Cannot remove creator
  if (project.createdBy.toString() === userId.toString()) {
    throw new Error('CANNOT_REMOVE_CREATOR');
  }

  // Remove member from ProjectMember table
  const result = await ProjectMember.findOneAndDelete({
    projectId,
    userId
  });

  if (!result) {
    throw new Error('MEMBER_NOT_FOUND');
  }

  return project;
};

/**
 * Get project summary (stats)
 */
export const getProjectSummary = async (projectId, currentOrganizationId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  if (!currentOrganizationId) {
    throw new Error('ORGANIZATION_REQUIRED');
  }

  const project = await Project.findOne({
    _id: projectId,
    organizationId: currentOrganizationId,
    deletedAt: null
  });

  if (!project) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  const now = new Date();

  // Get task statistics in parallel
  const [totalTasks, todo, doing, done, high, medium, low, overdue] = await Promise.all([
    Task.countDocuments({ projectId, deletedAt: null }),
    Task.countDocuments({ projectId, status: 'TODO', deletedAt: null }),
    Task.countDocuments({ projectId, status: 'DOING', deletedAt: null }),
    Task.countDocuments({ projectId, status: 'DONE', deletedAt: null }),
    Task.countDocuments({ projectId, priority: 'HIGH', deletedAt: null }),
    Task.countDocuments({ projectId, priority: 'MEDIUM', deletedAt: null }),
    Task.countDocuments({ projectId, priority: 'LOW', deletedAt: null }),
    Task.countDocuments({
      projectId,
      deletedAt: null,
      dueDate: { $lt: now },
      status: { $ne: 'DONE' }
    })
  ]);

  // Calculate days left
  let daysLeft = 0;
  if (project.deadline) {
    const end = new Date(project.deadline);
    const diffTime = end - now;
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) daysLeft = 0;
  }

  return {
    totalTasks,
    todo,
    doing,
    done,
    overdue,
    daysLeft,
    priority: { high, medium, low },
    tasksByStatus: [
      { _id: 'TODO', count: todo },
      { _id: 'DOING', count: doing },
      { _id: 'DONE', count: done }
    ]
  };
};

/**
 * Get project activities
 */
export const getProjectActivities = async (projectId, currentOrganizationId, page = 1, limit = 20) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  if (!currentOrganizationId) {
    throw new Error('ORGANIZATION_REQUIRED');
  }

  // Verify project belongs to organization
  const project = await Project.findOne({
    _id: projectId,
    organizationId: currentOrganizationId,
    deletedAt: null
  });

  if (!project) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    ActivityLog.find({ projectId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments({ projectId })
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Check if user is project member
 */
export const isProjectMember = async (projectId, userId, currentOrganizationId) => {
  if (!currentOrganizationId) {
    throw new Error('ORGANIZATION_REQUIRED');
  }

  // Verify project belongs to organization
  const project = await Project.findOne({
    _id: projectId,
    organizationId: currentOrganizationId,
    deletedAt: null
  });

  if (!project) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  const member = await ProjectMember.findOne({
    projectId,
    userId,
    status: 'ACTIVE'
  });

  return !!member;
};

/**
 * Get user's role in project
 */
export const getUserRoleInProject = async (projectId, userId, currentOrganizationId) => {
  if (!currentOrganizationId) {
    throw new Error('ORGANIZATION_REQUIRED');
  }

  // Verify project belongs to organization
  const project = await Project.findOne({
    _id: projectId,
    organizationId: currentOrganizationId,
    deletedAt: null
  });

  if (!project) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  const member = await ProjectMember.findOne({
    projectId,
    userId
  });

  return member ? member.roleInProject : null;
};

/**
 * Get project members from ProjectMember table
 */

export const getProjectMembers = async (projectId, currentOrganizationId) => {
  if (!mongoose.isValidObjectId(projectId)) throw new Error('INVALID_PROJECT_ID');
  if (!currentOrganizationId) throw new Error('ORGANIZATION_REQUIRED');

  // 1. Check Project
  const project = await Project.findOne({
    _id: projectId,
    organizationId: currentOrganizationId,
    deletedAt: null
  });

  if (!project) throw new Error('PROJECT_NOT_FOUND');
  
  // 2. Query ProjectMember
  const members = await ProjectMember.find({ projectId })
    .populate('userId', 'name email avatar role'); // Populate thêm role hệ thống của user

  // 3. Format Data khớp với Members.jsx
  return members.map((m) => {
    if (!m.userId) return null;

    return {
      _id: m._id, // Đây là membershipId (để xóa member khỏi project)
      
      // --- QUAN TRỌNG: Gom thông tin user vào object 'user' ---
      user: {
          _id: m.userId._id,
          name: m.userId.name,
          email: m.userId.email,
          avatar: m.userId.avatar,
          role: m.userId.role // Role hệ thống (Admin/User)
      },
      // --------------------------------------------------------

      // Các field của ProjectMember giữ ở ngoài
      role: m.roleInProject,        // Frontend dùng field này để hiển thị select box
      roles: [m.roleInProject],     // Frontend dùng mảng này để check quyền
      projectRole: m.roleInProject, 
      
      status: m.status,
      joinedAt: m.createdAt
    };
  }).filter(m => m !== null);
};

// ... (Các hàm bên dưới giữ nguyên)
/**
 * Get pending join requests across all projects
 */
export const getPendingRequests = async (organizationId) => {
  // Get all projects in organization
  const projects = await Project.find({ 
    organizationId,
    deletedAt: null 
  }).select('_id name');
  
  const projectIds = projects.map(p => p._id);

  // Get pending members
  const pendingMembers = await ProjectMember.find({
    projectId: { $in: projectIds },
    status: "PENDING"
  })
    .populate("userId", "name email avatar")
    .populate("projectId", "name");

  const formattedList = pendingMembers.map(pm => {
    if (!pm.userId || !pm.projectId) return null;
    
    return {
      requestId: pm._id,
      projectId: pm.projectId._id,
      projectName: pm.projectId.name,
      user: {
        _id: pm.userId._id,
        name: pm.userId.name,
        email: pm.userId.email,
        avatar: pm.userId.avatar
      },
      createdAt: pm.createdAt
    };
  }).filter(item => item !== null);

  return formattedList;
};

/**
 * Get or generate invite code for project
 */
export const getOrCreateInviteCode = async (projectId, currentOrganizationId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  if (!currentOrganizationId) {
    throw new Error('ORGANIZATION_REQUIRED');
  }

  let project = await Project.findOne({
    _id: projectId,
    organizationId: currentOrganizationId,
    deletedAt: null
  }).select('+inviteCode');
  
  if (!project) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  if (project.inviteCode) {
    return project.inviteCode;
  }

  // Generate new code with retry logic
  for (let i = 0; i < 5; i++) {
    try {
      let newCode;
      do {
        newCode = generateRandomCode(6);
      } while (await Project.findOne({ inviteCode: newCode }));
      
      project.inviteCode = newCode;
      await project.save();
      return newCode;

    } catch (err) {
      if (err.code === 11000) {
        console.warn(`Invite Code Race Condition for project ${projectId}. Retry ${i + 1}`);
        continue;
      }
      throw err;
    }
  }
  
  throw new Error('FAILED_TO_GENERATE_CODE');
};

/**
 * Reset invite code for project
 */
export const resetInviteCode = async (projectId, currentOrganizationId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  if (!currentOrganizationId) {
    throw new Error('ORGANIZATION_REQUIRED');
  }

  // Verify project belongs to organization
  const existingProject = await Project.findOne({
    _id: projectId,
    organizationId: currentOrganizationId,
    deletedAt: null
  });

  if (!existingProject) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  for (let i = 0; i < 5; i++) {
    try {
      let newCode;
      do {
        newCode = generateRandomCode(6);
      } while (await Project.findOne({ inviteCode: newCode }));

      const project = await Project.findByIdAndUpdate(
        projectId,
        { inviteCode: newCode },
        { new: true, select: '+inviteCode' }
      );

      if (!project || project.deletedAt) {
        throw new Error('PROJECT_NOT_FOUND');
      }

      return newCode;

    } catch (err) {
      if (err.code === 11000) {
        console.warn(`Reset Code Race Condition for project ${projectId}. Retry ${i + 1}`);
        continue;
      }
      throw err;
    }
  }
  
  throw new Error('FAILED_TO_RESET_CODE');
};

/**
 * Join project using invite code - WITH TRANSACTION & ROLE FIX
 */
export const joinProjectByCode = async (inviteCode, userId, currentOrganizationId) => {
  if (!inviteCode || typeof inviteCode !== 'string') {
    throw new Error('INVALID_INVITE_CODE');
  }

  const normalizedCode = inviteCode.toUpperCase().trim();

  //  START SESSION
  const session = await mongoose.startSession();
  
  try {
    //  START TRANSACTION
    session.startTransaction();

    // 1. Tìm Project bằng Code (WITH SESSION)
    const project = await Project.findOne({ 
      inviteCode: normalizedCode,
      deletedAt: null 
    }).session(session);
    
    if (!project) {
      await session.abortTransaction();
      throw new Error('INVALID_OR_EXPIRED_CODE');
    }

    // VALIDATE: Project đã bị archive
    if (project.isArchived) {
      await session.abortTransaction();
      throw new Error('PROJECT_ARCHIVED');
    }

    //  VALIDATE: Project status inactive
    if (project.status === 'archived' || project.status === 'inactive') {
      await session.abortTransaction();
      throw new Error('PROJECT_ARCHIVED');
    }

    const targetOrgId = project.organizationId;

    // 2.  CHECK EXISTING ORGANIZATION MEMBER 
    const existingOrgMember = await OrganizationMember.findOne({
      organizationId: targetOrgId,
      userId: userId
    }).session(session);

    // FIX ROLE LOGIC: Nếu đã là member của Org, KHÔNG CẬP NHẬT ROLE
    if (!existingOrgMember) {
      //  Case 1: User CHƯA thuộc Org này → Add vào Org với role ORG_MEMBER
      await OrganizationMember.create([{
        organizationId: targetOrgId,
        userId: userId,
        roleInOrganization: "ORG_MEMBER",
        status: "ACTIVE"
      }], { session });

      //  Cập nhật User: Add Org + Set role = Member (vì là member mới)
      await User.findByIdAndUpdate(
        userId, 
        {
          $addToSet: { organizations: targetOrgId },
          currentOrganizationId: targetOrgId,
          role: "Member" //  CHỈ set role khi là member MỚI
        },
        { session }
      );
    } else {
      //  Case 2: User ĐÃ thuộc Org này → CHỈ switch currentOrg, KHÔNG ĐỔI ROLE
      await User.findByIdAndUpdate(
        userId, 
        {
          currentOrganizationId: targetOrgId
          //  KHÔNG CẬP NHẬT role - GIỮ NGUYÊN role hiện tại (Admin/Manager/Member)
        },
        { session }
      );
    }

    // 3. Check & Add Project Member
    const existingProjectMember = await ProjectMember.findOne({
      projectId: project._id,
      userId
    }).session(session);

    if (existingProjectMember) {
      await session.abortTransaction();
      
      if (existingProjectMember.status === 'PENDING') {
        throw new Error('ALREADY_REQUESTED');
      }
      throw new Error('ALREADY_MEMBER');
    }

    //  Add to ProjectMember
    await ProjectMember.create([{
      projectId: project._id,
      userId,
      organizationId: targetOrgId,
      roleInProject: "Member", // Role trong project (khác với role hệ thống)
      status: "ACTIVE"
    }], { session });
    
    // 4.  Log activity (WITH SESSION)
    try {
      await ActivityLog.create([{
        projectId: project._id,
        userId: userId,
        organizationId: targetOrgId,
        action: "JOIN_PROJECT",
        entityType: "ProjectMember",
        entityId: userId,
        description: `joined project "${project.name}" via invite code`,
        metadata: {
          inviteCode: normalizedCode,
          projectName: project.name,
          isNewOrgMember: !existingOrgMember // Track if this is a new org member
        }
      }], { session });
    } catch (e) {
      console.error("Activity logging failed:", e.message);
      // Don't abort transaction for logging failure
    }
    
    //  COMMIT TRANSACTION
    await session.commitTransaction();
    
    return project._id;

  } catch (error) {
    //  ROLLBACK on error
    await session.abortTransaction();
    throw error;
  } finally {
    // CLEANUP session
    session.endSession();
  }
};