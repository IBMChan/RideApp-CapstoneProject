//laxmikanth: notification(email(smtp) - phone (firebase))
//prathik : book ride - ride accpet - ride cancel - basic functionalities wrt ride
//payment(paypal) and rating functionalities(r_to_d, d_to_r)

// ride.routes.js
import express from "express";
import RideController from "../controllers/rideController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rider
router.post("/create", authMiddleware, (req, res) => RideController.createRide(req, res));


// Driver
router.post("/accept/:ride_id", authMiddleware, (req, res) => RideController.acceptRide(req, res)); // Here, no body needed. driver_id will be taken from auth. (req.user?.id)
router.post("/cancel/:ride_id", RideController.cancelRide); // No body here
router.post("/complete/:ride_id", authMiddleware, (req, res) => RideController.completeRide(req, res));

router.get("/pending", authMiddleware, (req, res) => RideController.getPendingRides(req, res));
router.get("/ongoing", authMiddleware, (req, res) => RideController.getOngoingRides(req, res));
router.get("/history",authMiddleware, (req, res) => RideController.getRideHistory(req, res));

// General
router.patch("/status/:ride_id", authMiddleware, (req, res) => RideController.updateRideStatus(req, res));
router.get("/list", authMiddleware, (req, res) => RideController.listRides(req, res));
router.get("/:ride_id", RideController.getRide);

export default router;
