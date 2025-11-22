import express from "express";
import { 
  createProject, 
  listProjects, 
  getProject, 
  updateProject, 
  deleteProject, 
  getProjectMembers,
  getProjectSummary,
  getProjectActivities
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

export default router;