import { Router } from "express";
import * as walletController from "../controllers/walletController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// Wallet creation
router.post("/create", authMiddleware, walletController.createWallet);

// Add money
router.post("/add-money", authMiddleware, walletController.addMoney);
router.post("/verify-add-money", authMiddleware, walletController.verifyAddMoney);

// Withdraw money
router.post("/withdraw", authMiddleware, walletController.withdraw);

// Wallet info
router.get("/balance", authMiddleware, walletController.viewBalance);
router.get("/transactions", authMiddleware, walletController.viewTransactions);

// Reset PIN
router.post("/reset-pin", authMiddleware, walletController.resetPinRequest);
router.post("/reset-pin/confirm", authMiddleware, walletController.resetPinConfirm);

export default router;
