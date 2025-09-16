import { Router } from "express";
import * as walletController from "../controllers/walletController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/create", authMiddleware, walletController.createWallet);  // new rout
router.post("/add-money", authMiddleware, walletController.addMoney);

router.post("/verify-add-money", authMiddleware, walletController.verifyAddMoney);
router.post("/withdraw", authMiddleware, walletController.withdraw);
router.get("/balance", authMiddleware, walletController.viewBalance);
router.get("/transactions", authMiddleware, walletController.viewTransactions);

// Reset pin start - send email OTP and respond authentication pending
router.post("/reset-pin", authMiddleware, walletController.resetPinRequest);

// Confirm pin update by verifying OTP
router.post("/reset-pin/confirm", authMiddleware, walletController.resetPinConfirm);

export default router;
