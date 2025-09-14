//laxmikanth: notification(email(smtp) - phone (firebase))
//prathik : book ride - ride accpet - ride cancel - basic functionalities wrt ride
//payment(paypal) and rating functionalities(r_to_d, d_to_r)

// ride.routes.js
import express from "express";
import RideController from "../controllers/rideController.js";

const router = express.Router();

// Rider
router.post("/create", RideController.createRide);


// Driver
router.post("/accept/:ride_id", RideController.acceptRide); // Here, no body needed. driver_id will be taken from auth. (req.user?.id)
router.post("/cancel/:ride_id", RideController.cancelRide); // No body here
router.get("/pending", RideController.getPendingRides);
router.get("/ongoing", RideController.getOngoingRides);
router.get("/history", RideController.getRideHistory);

// General
router.get("/list/:role", RideController.listRides);
router.get("/:ride_id", RideController.getRide);



//payment
router.post("/:ride_id/status", RideController.updateRideStatus);
router.post("/:ride_id/pay", RideController.processPayment);

export default router;
