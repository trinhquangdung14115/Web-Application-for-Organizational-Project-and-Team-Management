import express from "express";
import { 
  createProject, 
  listProjects, 
  getProject, 
  updateProject, 
  deleteProject, 
  getProjectMembers,
  getProjectSummary,
  getProjectActivities,
  getInviteCode,
  resetInviteCode,
  joinProjectByCode,
  getPendingRequests,
  toggleArchive,
  removeProjectMember,
  updateMemberRole,
  addMember
} from "../controllers/project.controller.js";
import { verifyToken, checkRole, requireOrgAccess } from "../middlewares/auth.js";
import { requireProjectManager, requireProjectMember } from "../middlewares/project.auth.js";

const router = express.Router();

/**
 * @route   GET /projects
 * @desc    Get all projects
 */
router.get("/projects", verifyToken, listProjects);

/**
 * @route   POST /projects
 * @desc    Create new project
 */
router.post("/projects", verifyToken, checkRole("Admin", "Manager"), createProject);

/**
 * @route   POST /projects/join
 * @desc    Allow user to join a project using an invite code
 */
router.post("/projects/join", verifyToken, joinProjectByCode);

/**
 * @route   GET /projects/pending-requests
 * @desc    Get all pending join requests (QUAN TRỌNG: Phải đặt trước /projects/:id)
 */
router.get("/projects/pending-requests", verifyToken, checkRole("Admin", "Manager"), getPendingRequests);

/**
 * @route   GET /projects/:id
 * @desc    Get project detail
 */
router.get("/projects/:id", verifyToken, requireOrgAccess, requireProjectMember, getProject);

/**
 * @route   PUT /projects/:id
 * @desc    Update project
 */
router.put("/projects/:id", verifyToken, requireOrgAccess, requireProjectManager, updateProject);

/**
 * @route   DELETE /projects/:id
 * @desc    Soft delete project
 */
router.delete("/projects/:id", verifyToken, requireOrgAccess, requireProjectManager, deleteProject);

/**
 * @route   PATCH /projects/:id/archive
 * @desc    Archive or Unarchive a project
 */
router.patch("/projects/:id/archive", verifyToken, requireOrgAccess, requireProjectManager, toggleArchive);

/**
 * @route   POST /projects/:id/members
 * @desc    Add a member to project manually
 */
router.post("/projects/:id/members", verifyToken, requireOrgAccess, requireProjectManager, addMember);

/**
 * @route   GET /projects/:id/members
 * @desc    Get project members
 */
router.get("/projects/:id/members", verifyToken, requireOrgAccess, requireProjectMember, getProjectMembers);

/**
 * @route   GET /projects/:id/summary
 * @desc    Get dashboard statistics
 */
router.get("/projects/:id/summary", verifyToken, requireOrgAccess, requireProjectMember, getProjectSummary);

/**
 * @route   GET /projects/:id/activities
 * @desc    Get project activity logs
 */
router.get("/projects/:id/activities", verifyToken, requireOrgAccess, requireProjectMember, getProjectActivities);

/**
 * @route   GET /projects/:id/invite-code
 * @desc    Get the project's current invite code
 */
router.get("/projects/:id/invite-code", verifyToken, requireOrgAccess, requireProjectManager, getInviteCode);

/**
 * @route   PATCH /projects/:id/invite-code
 * @desc    Reset invite code
 */
router.patch("/projects/:id/invite-code", verifyToken, requireOrgAccess, requireProjectManager, resetInviteCode);
//  Xóa thành viên khỏi dự án (Chỉ Project Manager/Admin)
router.delete('/projects/:id/members/:memberId', verifyToken, requireOrgAccess, requireProjectManager, removeProjectMember);
// Sửa Role thành viên trong dự án (Chỉ Project Manager/Admin)
router.put('/projects/:id/members/:userId', verifyToken, requireOrgAccess, requireProjectManager, updateMemberRole);
export default router;