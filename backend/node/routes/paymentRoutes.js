// export default router;
import { Router } from "express";
import PaymentController from "../controllers/paymentController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// Rider initiates final payment for completed ride with selected mode (wallet/cash/upi)
router.post("/ride/:ride_id/initiate", authMiddleware, PaymentController.initiateRidePayment.bind(PaymentController));

// Driver confirms payment (only applicable for cash/upi modes)
router.post("/ride/:ride_id/confirm", authMiddleware, PaymentController.confirmRidePayment.bind(PaymentController));

export default router;
