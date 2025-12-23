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
import { verifyToken, checkRole } from "../middlewares/auth.js";

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
router.get("/projects/:id", verifyToken, getProject);

/**
 * @route   PUT /projects/:id
 * @desc    Update project
 */
router.put("/projects/:id", verifyToken, checkRole("Admin", "Manager"), updateProject);

/**
 * @route   DELETE /projects/:id
 * @desc    Soft delete project
 */
router.delete("/projects/:id", verifyToken, checkRole("Admin", "Manager"), deleteProject);

/**
 * @route   PATCH /projects/:id/archive
 * @desc    Archive or Unarchive a project
 */
router.patch("/projects/:id/archive", verifyToken, checkRole("Admin", "Manager"), toggleArchive);

/**
 * @route   POST /projects/:id/members
 * @desc    Add a member to project manually
 */
router.post("/projects/:id/members", verifyToken, checkRole("Admin", "Manager"), addMember);

/**
 * @route   GET /projects/:id/members
 * @desc    Get project members
 */
router.get("/projects/:id/members", verifyToken, getProjectMembers);

/**
 * @route   GET /projects/:id/summary
 * @desc    Get dashboard statistics
 */
router.get("/projects/:id/summary", verifyToken, getProjectSummary);

/**
 * @route   GET /projects/:id/activities
 * @desc    Get project activity logs
 */
router.get("/projects/:id/activities", verifyToken, getProjectActivities);

/**
 * @route   GET /projects/:id/invite-code
 * @desc    Get the project's current invite code
 */
router.get("/projects/:id/invite-code", verifyToken, checkRole("Admin", "Manager"), getInviteCode);

/**
 * @route   PATCH /projects/:id/invite-code
 * @desc    Reset invite code
 */
router.patch("/projects/:id/invite-code", verifyToken, checkRole("Admin", "Manager"), resetInviteCode);
//  Xóa thành viên khỏi dự án
router.delete('/projects/:id/members/:memberId', verifyToken, removeProjectMember);
// Sửa Role thành viên trong dự án 
router.put('/projects/:id/members/:userId', verifyToken, updateMemberRole);
export default router;