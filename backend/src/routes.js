import { Router } from "express";
import { me, promoteRole, signup, login, handleGoogleLogin, changePassword, updateProfile, forgotPassword, resetPassword, switchOrg } from "./controllers/auth.controller.js";
import { verifyToken, checkRole, requireOrgAccess } from "./middlewares/auth.js";
import { ROLES } from "./models/user.model.js";
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  toggleArchive,
  getProjectSummary,
  getProjectActivities,
  getPendingRequests,
} from "./controllers/project.controller.js";
import { listUsers, searchUsers, getUser, updateUserStatus, deleteUser } from "./controllers/user.controller.js";
import { getLabels, createLabel, updateLabel, deleteLabel } from "./controllers/label.controller.js";
import { getMembers, addMember, removeMember, joinRequest, approveMember } from "./controllers/membership.controller.js";
import { checkProjectActive } from "./middlewares/archive.middleware.js";
import taskRoutes from "./routes/task.routes.js";
import meetingRoutes from "./routes/meeting.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import organizationRoutes from "./routes/organization.routes.js";

const router = Router();

router.get("/healthz", (req, res) => res.json({ ok: true }));
router.get("/auth/me", verifyToken, me);

router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.post("/auth/google", handleGoogleLogin);
router.post("/auth/change-password", verifyToken, changePassword);
router.patch("/auth/profile", verifyToken, updateProfile);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);
router.post("/auth/switch-org", verifyToken, switchOrg);

// Admin-only: promote a user to a role (default: Manager)
router.put("/auth/:id/role", verifyToken, checkRole(ROLES.ADMIN), promoteRole);

router.get("/protected/me", verifyToken, (req, res) => {
  res.json({ message: "Authenticated", user: req.user });
});

router.get("/protected/admin",
  verifyToken,
  checkRole(ROLES.ADMIN),
  (req, res) => res.json({ message: "Admin only content" })
);

router.get("/protected/manager",
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.MANAGER),
  (req, res) => res.json({ message: "Manager or Admin content" })
);

router.use("/", taskRoutes);
router.use("/", meetingRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/", organizationRoutes);

// Projects - All require organization context
router.post("/projects", verifyToken, requireOrgAccess, checkRole(ROLES.ADMIN, ROLES.MANAGER), createProject);
router.get("/projects", verifyToken, requireOrgAccess, listProjects);
router.get("/projects/pending-requests", verifyToken, requireOrgAccess, checkRole(ROLES.ADMIN,ROLES.MANAGER), getPendingRequests);
router.get("/projects/:id", verifyToken, requireOrgAccess, getProject);
router.put("/projects/:id", verifyToken, requireOrgAccess, checkRole(ROLES.ADMIN, ROLES.MANAGER), checkProjectActive, updateProject);
router.delete("/projects/:id", verifyToken, requireOrgAccess, checkRole(ROLES.ADMIN, ROLES.MANAGER), deleteProject);
router.patch("/projects/:id/archive", verifyToken, requireOrgAccess, checkRole(ROLES.ADMIN, ROLES.MANAGER), toggleArchive);
router.get("/projects/:id/summary", verifyToken, requireOrgAccess, getProjectSummary);
router.get("/projects/:id/activities", verifyToken, requireOrgAccess, getProjectActivities);

// Project Members - Require organization context
router.get("/projects/:id/members", verifyToken, requireOrgAccess, getMembers);
router.post("/projects/:id/members", verifyToken, requireOrgAccess, checkRole(ROLES.ADMIN, ROLES.MANAGER), checkProjectActive, addMember);
router.delete("/projects/:id/members/:memberId", verifyToken, requireOrgAccess, checkRole(ROLES.ADMIN, ROLES.MANAGER), checkProjectActive, removeMember);
router.post("/projects/:id/join", verifyToken, requireOrgAccess, joinRequest);
router.patch("/projects/:projectId/members/:memberId/approve", verifyToken, requireOrgAccess, checkRole(ROLES.ADMIN, ROLES.MANAGER), approveMember);

// Project Labels - Require organization context
router.get("/projects/:id/labels", verifyToken, requireOrgAccess, getLabels);
router.post("/projects/:id/labels", verifyToken, requireOrgAccess, checkRole(ROLES.ADMIN, ROLES.MANAGER), checkProjectActive, createLabel);
router.patch("/projects/:id/labels/:labelId", verifyToken, requireOrgAccess, checkRole(ROLES.ADMIN, ROLES.MANAGER), checkProjectActive, updateLabel);
router.delete("/projects/:id/labels/:labelId", verifyToken, requireOrgAccess, checkRole(ROLES.ADMIN, ROLES.MANAGER), checkProjectActive, deleteLabel);

// Users - Require organization context for search
router.get("/users", verifyToken, requireOrgAccess, listUsers);
router.get("/users/search", verifyToken, requireOrgAccess, searchUsers);
router.get("/users/:id", verifyToken, checkRole(ROLES.ADMIN), getUser);
router.patch("/users/:id/status", verifyToken, checkRole(ROLES.ADMIN), updateUserStatus);
router.delete("/users/:id", verifyToken, checkRole(ROLES.ADMIN), deleteUser);

export default router;