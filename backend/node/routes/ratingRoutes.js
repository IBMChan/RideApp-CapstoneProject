// Raksha & Harshit

import express from "express";
import * as ratingController from "../controllers/ratingController";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware)

// ---------------- 7. Ratings (Rider → Driver) ----------------
// Rider gives rating to driver for a ride
router.post("/rate/:rideId", ratingController.rateDriver);
router.get("/rate/:rideId", ratingController.getDriverRating);
router.put("/rate/:rideId", ratingController.updateDriverRating);
router.delete("/rate/:rideId", ratingController.deleteDriverRating);

// ---------------- 8. Ratings (Driver → Rider) ----------------
// Driver gives rating to rider for a ride
router.post("/rate-rider/:rideId", ratingController.rateRider);
router.get("/rate-rider/:rideId", ratingController.getRiderRating);
router.put("/rate-rider/:rideId", ratingController.updateRiderRating);
router.delete("/rate-rider/:rideId", ratingController.deleteRiderRating);

export default router;
