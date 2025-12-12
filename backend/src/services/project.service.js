/**
 * Project Service Layer
 * Business logic for project management
 */

import mongoose from "mongoose";
import Project from "../models/project.model.js";
import User from "../models/user.model.js";
import Task from "../models/task.model.js";
import ActivityLog from "../models/activityLog.model.js";

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
export const createProject = async (projectData, creatorId) => {
  const { name, description, deadline, manager, startDate, endDate } = projectData;

  // Auto-promote manager if specified
  if (manager && manager !== creatorId.toString()) {
    const userToPromote = await User.findById(manager);
    if (userToPromote && userToPromote.role === "Member") {
      userToPromote.role = "Manager";
      await userToPromote.save();
      console.log(`✅ Auto-promoted user ${userToPromote.email} to Manager`);
    }
  }

  // Build initial members array
  const initialMembers = [{ user: creatorId, role: "Admin", status: "ACTIVE" }];
  if (manager && manager !== creatorId.toString()) {
    initialMembers.push({ user: manager, role: "Manager", status: "ACTIVE" });
  }

  // Create project
  const project = new Project({
    name: name.trim(),
    description: description?.trim() || "",
    startDate: startDate || null,
    endDate: endDate || null,
    deadline: deadline || null,
    createdBy: creatorId,
    members: initialMembers,
    code: generateRandomCode(),
  });

  await project.save();

  // Log activity
  try {
    await ActivityLog.create({
      projectId: project._id,
      userId: creatorId,
      action: "CREATE_PROJECT",
      description: `Created project "${name}"`,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }

  return project;
};

/**
 * Get all projects (with filters)
 */
export const listProjects = async (filters = {}) => {
  const query = { deletedAt: null };

  // Apply filters
  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.archived !== undefined) {
    query.isArchived = filters.archived === 'true';
  }

  if (filters.userId) {
    query['members.user'] = filters.userId;
  }

  // Pagination
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const skip = (page - 1) * limit;

  const projects = await Project.find(query)
    .populate('createdBy', 'name email')
    .populate('members.user', 'name email role')
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
export const getProjectById = async (projectId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  const project = await Project.findById(projectId)
    .populate('createdBy', 'name email')
    .populate('members.user', 'name email role avatar');

  if (!project || project.deletedAt) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  return project;
};

/**
 * Update project
 */
export const updateProject = async (projectId, updateData, userId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
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
export const deleteProject = async (projectId, userId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
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
export const toggleArchive = async (projectId, userId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  project.isArchived = !project.isArchived;
  await project.save();

  // Log activity
  const action = project.isArchived ? "ARCHIVE_PROJECT" : "UNARCHIVE_PROJECT";
  try {
    await ActivityLog.create({
      projectId: project._id,
      userId,
      action,
      description: `${project.isArchived ? 'Archived' : 'Unarchived'} project "${project.name}"`,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }

  return project;
};

/**
 * Add member to project
 */
export const addMember = async (projectId, userId, role = "Member") => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new Error('INVALID_USER_ID');
  }

  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  // Check if user already exists
  const existingMember = project.members.find(
    m => m.user.toString() === userId.toString()
  );

  if (existingMember) {
    throw new Error('USER_ALREADY_MEMBER');
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // Add member
  project.members.push({
    user: userId,
    role,
    status: "ACTIVE",
  });

  await project.save();

  return project;
};

/**
 * Remove member from project
 */
export const removeMember = async (projectId, userId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new Error('INVALID_USER_ID');
  }

  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  // Cannot remove creator
  if (project.createdBy.toString() === userId.toString()) {
    throw new Error('CANNOT_REMOVE_CREATOR');
  }

  // Remove member
  project.members = project.members.filter(
    m => m.user.toString() !== userId.toString()
  );

  await project.save();

  return project;
};

/**
 * Get project summary (stats)
 */
export const getProjectSummary = async (projectId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  // Get task statistics
  const tasks = await Task.find({ projectId, deletedAt: null });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const todoTasks = tasks.filter(t => t.status === 'TODO').length;

  const completionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  return {
    project,
    stats: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate,
      totalMembers: project.members.length,
      activeMembers: project.members.filter(m => m.status === 'ACTIVE').length,
    },
  };
};

/**
 * Get project activities
 */
export const getProjectActivities = async (projectId, limit = 20) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  const activities = await ActivityLog.find({ projectId })
    .populate('userId', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(limit);

  return activities;
};

/**
 * Check if user is project member
 */
export const isProjectMember = async (projectId, userId) => {
  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
    return false;
  }

  return project.members.some(
    m => m.user.toString() === userId.toString() && m.status === 'ACTIVE'
  );
};

/**
 * Get user's role in project
 */
export const getUserRoleInProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
    return null;
  }

  const member = project.members.find(
    m => m.user.toString() === userId.toString()
  );

  return member ? member.role : null;
};
