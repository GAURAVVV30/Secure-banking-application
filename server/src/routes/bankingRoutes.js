import { Router } from "express";
import {
	confirmLoan,
	creditFunds,
	getBalance,
	getHistory,
	previewLoan,
	transferFunds,
	getLoans,
	getAggregatedTotals,
	getVirtualCard,
	generateVirtualCard,
	freezeVirtualCard,
	deleteVirtualCard,
	processCardTransaction,
	processBillPayment
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
router.get("/loans", authRequired, getLoans);
router.get("/totals", authRequired, getAggregatedTotals);
router.post("/pay", authRequired, processBillPayment);


router.get("/card", authRequired, getVirtualCard);
router.post("/card/generate", authRequired, generateVirtualCard);
router.put("/card/freeze", authRequired, freezeVirtualCard);
router.delete("/card", authRequired, deleteVirtualCard);
router.post("/process-card", processCardTransaction);

export default router;
