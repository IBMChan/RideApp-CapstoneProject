import { Router } from "express";
import { debitWallet } from "../controllers/walletController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/debit", authMiddleware, debitWallet);

export default router;
