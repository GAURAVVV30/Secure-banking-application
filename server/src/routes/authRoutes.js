import { Router } from "express";
import rateLimit from "express-rate-limit";
import { completeProfile, login, register, forgotPassword } from "../controllers/authController.js";

const router = Router();
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Too many login attempts. Try again in 15 minutes." }
});

router.post("/register", register);
router.post("/complete-profile", completeProfile);
router.post("/login", loginLimiter, login);
router.post("/forgot-password", forgotPassword);

export default router;
