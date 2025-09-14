import { Router } from "express";
import rideController from "../controllers/rideController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/create", authMiddleware, rideController.createRide);
router.get("/pending", authMiddleware, rideController.getPendingRides);
router.post("/accept/:ride_id", authMiddleware, rideController.acceptRide);
router.patch("/status/:ride_id", authMiddleware, rideController.updateRideStatus);
router.post("/complete/:ride_id", authMiddleware, rideController.completeRide);
router.post("/cancel/:ride_id", authMiddleware, rideController.cancelRide);
router.get("/ongoing", authMiddleware, rideController.getOngoingRides);
router.get("/history", authMiddleware, rideController.getRideHistory);
router.get("/list", authMiddleware, rideController.listRides);
router.get("/:ride_id", authMiddleware, rideController.getRide);
router.post("/:ride_id/payment", authMiddleware, rideController.processPayment);
router.post("/:ride_id/initiate-payment", authMiddleware, rideController.initiatePayment);
router.post("/:ride_id/confirm-payment", authMiddleware, rideController.confirmPayment);

export default router;
