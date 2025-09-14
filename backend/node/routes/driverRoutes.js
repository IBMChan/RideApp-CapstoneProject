import express from 'express';
import driverController from '../controllers/driverController.js';

const router = express.Router();

// Profile
router.get("/profile", driverController.getProfile);
router.patch("/profile", driverController.updateProfile);

// Ride History
router.get("/rides", driverController.getRideHistory);

// Payment History
router.get("/payments", driverController.getPaymentHistory);

// Vehicles
router.post("/vehicles", driverController.addVehicle);
router.put("/vehicles/:vehicleId", driverController.updateVehicle);
router.delete("/vehicles/:vehicleId", driverController.deleteVehicle);

// Status
router.put("/status", driverController.updateStatus);

// Payment confirmation
router.post("/payments/:payment_id/confirm", driverController.confirmPayment);

export default router;
