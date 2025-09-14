// routes/driverRoutes.js
import express from "express";
import driverController from "../controllers/driverController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes for drivers require auth
router.use(authMiddleware);

// Profile
router.get("/profile", driverController.getProfile);
router.patch("/profile", driverController.updateProfile);

// Ride History
router.get("/rides", driverController.getRideHistory);

// Payment History
router.get("/payments", driverController.getPaymentHistory);

// Average rating
router.get("/rating", driverController.getAverageRating);

// Vehicles
router.post("/vehicles", driverController.addVehicle);
router.get("/vehicles", driverController.listVehicles); // list vehicles for driver
router.get("/vehicles/:vehicleId", driverController.updateVehicle); // optional - you can use get as reuse update method or create separate getById
router.put("/vehicles/:vehicleId", driverController.updateVehicle);
router.delete("/vehicles/:vehicleId", driverController.deleteVehicle);

// Set vehicle status (active/inactive)
router.patch("/vehicles/:vehicleId/status", driverController.setVehicleStatus);

// Status (driver online/offline)
router.put("/status", driverController.updateStatus);

// Payment confirmation
router.post("/payments/:payment_id/confirm", driverController.confirmPayment);

// Driver wallet withdrawal
router.post("/:driver_id/wallet/withdraw", driverController.withdrawMoney);

export default router;


// import express from 'express';
// import driverController from '../controllers/driverController.js';
// import { authMiddleware } from '../middlewares/authMiddleware.js';
// const router = express.Router();

// // Profile
// router.get("/profile",authMiddleware, driverController.getProfile);
// router.patch("/profile",authMiddleware ,driverController.updateProfile);

// // Ride History
// router.get("/rides", authMiddleware,driverController.getRideHistory);

// // Payment History
// router.get("/payments", authMiddleware,driverController.getPaymentHistory);

// //Average rating 
// router.get("/rating",authMiddleware,driverController.getAverageRating);
// // Vehicles
// router.post("/vehicles", authMiddleware,driverController.addVehicle);
// router.put("/vehicles/:vehicleId", authMiddleware, driverController.updateVehicle);
// router.delete("/vehicles/:vehicleId", authMiddleware,driverController.deleteVehicle);

// // Status
// router.put("/status",authMiddleware,driverController.updateStatus);
// router.put("/status", authMiddleware, driverController.updateStatus);

// // Payment confirmation
// router.post("/payments/:payment_id/confirm", authMiddleware, driverController.confirmPayment);

// // Driver wallet withdrawal
// router.post("/:driver_id/wallet/withdraw", authMiddleware, driverController.withdrawMoney);

// export default router;
