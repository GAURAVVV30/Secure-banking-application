import { Router } from "express";
import {
	confirmLoan,
	creditFunds,
	getBalance,
	getHistory,
	previewLoan,
	transferFunds
} from "../controllers/bankingController.js";
import { authRequired } from "../middleware/auth.js";
import { sendMoneyGuard } from "../middleware/sendMoneyGuard.js";

const router = Router();
router.get("/balance", authRequired, getBalance);
router.get("/history", authRequired, getHistory);
router.post("/credit", authRequired, creditFunds);
router.post("/loan/preview", authRequired, previewLoan);
router.post("/loan/confirm", authRequired, confirmLoan);
router.post("/transfer", authRequired, sendMoneyGuard, transferFunds);

export default router;
