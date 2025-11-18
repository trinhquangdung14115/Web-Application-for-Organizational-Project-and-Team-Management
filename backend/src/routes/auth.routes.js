import { Router } from "express";
import { signup, login, handleGoogleLogin } from "../controllers/auth.controller.js";

const router = Router();

// Định nghĩa các đường dẫn
router.post("/signup", signup);
router.post("/login", login);
router.post("/google", handleGoogleLogin); 

export default router;