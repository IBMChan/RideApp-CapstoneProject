// routes/riderRoutes.js
// Raksha & Harshit (rides, profile, locations, complaints, lost items)
// Chandana - wallet management
// Error handler integrated globally in app.js

import express from "express";
import * as riderController from "../controllers/riderController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();
// router.use(authMiddleware)

// ---------------- 1. Ride history ----------------
// Example: GET /api/rider/history/2
router.get("/history/:riderId",authMiddleware, riderController.getRideHistory);

// ---------------- 2. Profile management ----------------
// Example: GET /api/rider/profile/2
router.get("/profile/:riderId",authMiddleware, riderController.getProfile);
router.put("/profile/:riderId",authMiddleware, riderController.updateProfile);

// ---------------- 3. Saved locations ----------------
// Example: GET  /api/rider/2/locations
// Example: POST /api/rider/2/locations
// Example: DELETE /api/rider/2/locations/5
router.get("/:riderId/locations", authMiddleware, riderController.getSavedLocations);
router.post("/:riderId/locations", authMiddleware, riderController.addSavedLocation);
router.delete("/:riderId/locations/:id", authMiddleware, riderController.deleteSavedLocation);

// ---------------- 4. Share ride status ----------------
router.post("/share-ride-email/:rideId", authMiddleware, riderController.shareRideStatusEmail);


//-------------------SOS-----------------------------------------
router.post("/sos/:riderId", authMiddleware, riderController.sendSOS);

// ---------------- 5. Complaints + Lost items ----------------
// Example: POST /api/rider/complaints/15
router.post("/complaints/:rideId", authMiddleware, riderController.registerComplaint);
// Example: GET /api/rider/complaints?riderId=2
router.get("/complaints", authMiddleware, riderController.getComplaints);
// Example: GET /api/rider/lost-items/15?riderId=2
router.get("/lost-items/:rideId", authMiddleware, riderController.getLostItems);
// Example: POST /api/rider/lost-items/2/15
router.post("/lost-items/:riderId/:rideId", authMiddleware, riderController.reportLostItem);


export default router;
