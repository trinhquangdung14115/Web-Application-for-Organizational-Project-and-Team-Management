import { Router } from "express";
import { me, promoteRole, signup, login, handleGoogleLogin, changePassword, updateProfile } from "./controllers/auth.controller.js";
import { verifyToken, checkRole } from "./middlewares/auth.js";
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

const router = Router();

router.get("/healthz", (req, res) => res.json({ ok: true }));
router.get("/auth/me", verifyToken, me);

router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.post("/auth/google", handleGoogleLogin);
router.post("/auth/change-password", verifyToken, changePassword);
router.patch("/auth/profile", verifyToken, updateProfile);

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
router.use("/", attendanceRoutes);

// Projects
router.post("/projects", verifyToken, checkRole(ROLES.ADMIN, ROLES.MANAGER), createProject);
router.get("/projects", verifyToken, listProjects);
router.get("/projects/pending-requests", verifyToken, checkRole(ROLES.ADMIN), getPendingRequests);
router.get("/projects/:id", verifyToken, getProject);
router.put("/projects/:id", verifyToken, checkRole(ROLES.ADMIN, ROLES.MANAGER), checkProjectActive, updateProject);
router.delete("/projects/:id", verifyToken, checkRole(ROLES.ADMIN, ROLES.MANAGER), deleteProject);
router.patch("/projects/:id/archive", verifyToken, checkRole(ROLES.ADMIN, ROLES.MANAGER), toggleArchive);
router.get("/projects/:id/summary", verifyToken, getProjectSummary);
router.get("/projects/:id/activities", verifyToken, getProjectActivities);

// Project Members
router.get("/projects/:id/members", verifyToken, getMembers);
router.post("/projects/:id/members", verifyToken, checkRole(ROLES.ADMIN, ROLES.MANAGER), checkProjectActive, addMember);
router.delete("/projects/:id/members/:memberId", verifyToken, checkRole(ROLES.ADMIN, ROLES.MANAGER), checkProjectActive, removeMember);
router.post("/projects/:id/join", verifyToken, joinRequest);
router.patch("/projects/:projectId/members/:memberId/approve", verifyToken, checkRole(ROLES.ADMIN, ROLES.MANAGER), approveMember);

// Project Labels
router.get("/projects/:id/labels", verifyToken, getLabels);
router.post("/projects/:id/labels", verifyToken, checkRole(ROLES.ADMIN, ROLES.MANAGER), checkProjectActive, createLabel);
router.patch("/projects/:id/labels/:labelId", verifyToken, checkRole(ROLES.ADMIN, ROLES.MANAGER), checkProjectActive, updateLabel);
router.delete("/projects/:id/labels/:labelId", verifyToken, checkRole(ROLES.ADMIN, ROLES.MANAGER), checkProjectActive, deleteLabel);

// Users
router.get("/users", verifyToken, listUsers); // Member cũng có thể xem danh sách users
router.get("/users/search", verifyToken, searchUsers);
router.get("/users/:id", verifyToken, checkRole(ROLES.ADMIN), getUser);
router.patch("/users/:id/status", verifyToken, checkRole(ROLES.ADMIN), updateUserStatus);
router.delete("/users/:id", verifyToken, checkRole(ROLES.ADMIN), deleteUser);

export default router;