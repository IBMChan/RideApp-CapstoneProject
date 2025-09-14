import express from 'express';
import driverController from '../controllers/driverController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Profile
router.get("/profile", authMiddleware, driverController.getProfile);
router.patch("/profile", authMiddleware, driverController.updateProfile);

// Ride History
router.get("/rides", authMiddleware, driverController.getRideHistory);

// Payment History
router.get("/payments", authMiddleware, driverController.getPaymentHistory);

// Vehicles
router.post("/vehicles", authMiddleware, driverController.addVehicle);
router.put("/vehicles/:vehicleId", authMiddleware, driverController.updateVehicle);
router.delete("/vehicles/:vehicleId", authMiddleware, driverController.deleteVehicle);

// Status
router.put("/status", authMiddleware, driverController.updateStatus);

// Payment confirmation
router.post("/payments/:payment_id/confirm", authMiddleware, driverController.confirmPayment);

// Driver wallet withdrawal
router.post("/:driver_id/wallet/withdraw", authMiddleware, driverController.withdrawMoney);

export default router;
