import { Router } from "express";
import { me, promoteRole, signup, login, handleGoogleLogin } from "./controllers/auth.controller.js";
import { verifyToken, checkRole } from "./middlewares/auth.js";
import { ROLES } from "./models/user.model.js";
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectMembers,
} from "./controllers/project.controller.js";
import { listUsers } from "./controllers/user.controller.js";
import taskRoutes from "./routes/task.routes.js";

const router = Router();

router.get("/healthz", (req, res) => res.json({ ok: true }));
router.get("/auth/me", verifyToken, me);

router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.post("/auth/google", handleGoogleLogin);

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

// Projects
router.post("/projects", verifyToken, checkRole(ROLES.ADMIN, ROLES.MANAGER), createProject);
router.get("/projects", verifyToken, listProjects);
router.get("/projects/:id", verifyToken, getProject);
router.put("/projects/:id", verifyToken, checkRole(ROLES.ADMIN, ROLES.MANAGER), updateProject);
router.delete("/projects/:id", verifyToken, checkRole(ROLES.ADMIN, ROLES.MANAGER), deleteProject);
router.get("/projects/:id/members", verifyToken, getProjectMembers);

// Users (admin)
router.get("/users", verifyToken, listUsers); // bỏ checkrole để member cũng xem được

export default router;
