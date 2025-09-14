import { Router } from "express";
import PaymentController from "../controllers/paymentController.js";
import { debitWallet } from "../controllers/walletController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/add-money/:user_id", authMiddleware, PaymentController.addMoney.bind(PaymentController));
router.post("/verify-add-money", authMiddleware, PaymentController.verifyAddMoney.bind(PaymentController));
router.post("/withdraw/:user_id", authMiddleware, PaymentController.withdraw.bind(PaymentController));
router.post("/ride/:ride_id/initiate", authMiddleware, PaymentController.initiateRidePayment.bind(PaymentController));
router.post("/ride/:ride_id/confirm", authMiddleware, PaymentController.confirmRidePayment.bind(PaymentController));
router.post("/wallet/debit", authMiddleware, debitWallet);

export default router;
