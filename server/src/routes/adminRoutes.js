import { Router } from "express";
import {
	blockUser,
	deleteBank,
	deleteUser,
	getSecurityFeed,
	getUserFullHistory,
	getUsersByBank,
  getDashboardStats,
  clearLogs,
  getAllLogs
} from "../controllers/adminController.js";
import { authRequired, requireRoles } from "../middleware/auth.js";

const router = Router();
router.get("/stats", authRequired, requireRoles("admin"), getDashboardStats);
router.get("/logs", authRequired, requireRoles("admin"), getAllLogs);
router.get("/users", authRequired, requireRoles("admin"), getUsersByBank);
router.get("/users/:userId/history", authRequired, requireRoles("admin"), getUserFullHistory);
router.get("/security-feed", authRequired, requireRoles("admin"), getSecurityFeed);
router.post("/logs/clear", authRequired, requireRoles("admin"), clearLogs);
router.patch("/users/:userId/block", authRequired, requireRoles("admin"), blockUser);
router.delete("/users/:userId", authRequired, requireRoles("admin"), deleteUser);
router.delete("/banks/:bankName", authRequired, requireRoles("admin"), deleteBank);

export default router;
