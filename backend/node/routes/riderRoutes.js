// routes/riderRoutes.js
// Raksha & Harshit (rides, profile, locations, complaints, lost items)
// Chandana - wallet management
// Error handler integrated globally in app.js

import express from "express";
import * as riderController from "../controllers/riderController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware)

// ---------------- 1. Ride history ----------------
// Example: GET /api/rider/history/2
router.get("/history/:riderId", riderController.getRideHistory);

// ---------------- 2. Profile management ----------------
// Example: GET /api/rider/profile/2
router.get("/profile/", riderController.getProfile);
router.put("/profile/:riderId", riderController.updateProfile);

// ---------------- 3. Saved locations ----------------
// Example: GET  /api/rider/2/locations
// Example: POST /api/rider/2/locations
// Example: DELETE /api/rider/2/locations/5
router.get("/:riderId/locations", riderController.getSavedLocations);
router.post("/:riderId/locations", riderController.addSavedLocation);
router.delete("/:riderId/locations/:id", riderController.deleteSavedLocation);

// ---------------- 4. Share ride status ----------------
router.post("/share-ride-email/:rideId", riderController.shareRideStatusEmail);


//-------------------SOS-----------------------------------------
router.post("/sos/:riderId", riderController.sendSOS);

// ---------------- 5. Complaints + Lost items ----------------
// Example: POST /api/rider/complaints/15
router.post("/complaints/:rideId", riderController.registerComplaint);
// Example: GET /api/rider/complaints?riderId=2
router.get("/complaints", riderController.getComplaints);
// Example: GET /api/rider/lost-items/15?riderId=2
router.get("/lost-items/:rideId", riderController.getLostItems);
// Example: POST /api/rider/lost-items/2/15
router.post("/lost-items/:riderId/:rideId", riderController.reportLostItem);


// ---------------- 7. Ratings (Rider → Driver) ----------------
// Rider gives rating to driver for a ride
router.post("/rate/:rideId", riderController.rateDriver);
router.get("/rate/:rideId", riderController.getDriverRating);
router.put("/rate/:rideId", riderController.updateDriverRating);
router.delete("/rate/:rideId", riderController.deleteDriverRating);

// ---------------- 8. Ratings (Driver → Rider) ----------------
// Driver gives rating to rider for a ride
router.post("/rate-rider/:rideId", riderController.rateRider);
router.get("/rate-rider/:rideId", riderController.getRiderRating);
router.put("/rate-rider/:rideId", riderController.updateRiderRating);
router.delete("/rate-rider/:rideId", riderController.deleteRiderRating);

export default router;
