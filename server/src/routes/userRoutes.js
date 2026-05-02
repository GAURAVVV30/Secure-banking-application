import { Router } from "express";
import { getProfile, updateContact, updatePassword } from "../controllers/userController.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/profile", authRequired, getProfile);
router.put("/contact", authRequired, updateContact);
router.put("/password", authRequired, updatePassword);

export default router;
