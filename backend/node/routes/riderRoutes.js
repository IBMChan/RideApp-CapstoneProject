// routes/riderRoutes.js
// Raksha & Harshit (rides, profile, locations, complaints, lost items)
// Chandana - wallet management
// Error handler integrated globally in app.js

import express from "express";
import * as riderController from "../controllers/riderController.js";

const router = express.Router();

// 1. Ride history
// Example: GET /api/rider/history/2
router.get("/history/:riderId", riderController.getRideHistory);

// 2. Profile management
// Example: GET /api/rider/profile/2
router.get("/profile/:riderId", riderController.getProfile);
router.put("/profile/:riderId", riderController.updateProfile);

// 3. Saved locations
// Example: GET  /api/rider/2/locations
// Example: POST /api/rider/2/locations
// Example: DELETE /api/rider/2/locations/5
router.get("/:riderId/locations", riderController.getSavedLocations);
router.post("/:riderId/locations", riderController.addSavedLocation);
router.delete("/:riderId/locations/:id", riderController.deleteSavedLocation);

// 4. Share ride status
// Example: POST /api/rider/share-ride/15
router.post("/share-ride/:rideId", riderController.shareRideStatus);

// 5. Complaints + Lost items
// Example: POST /api/rider/complaints/15
router.post("/complaints/:rideId", riderController.registerComplaint);
//get complaint
router.get("/complaints", riderController.getComplaints);
// Example: GET /api/rider/lost-items/15?riderId=2
router.get("/lost-items/:rideId", riderController.getLostItems);
// report item
router.post("/lost-items/:riderId/:rideId",riderController.reportLostItem);

// 6. Wallet management
// Example: POST /api/rider/addMoney
router.post("/addMoney", riderController.addMoney);
// import express from "express";
// import riderController from "../controllers/riderController.js";
// import { authMiddleware } from "../middlewares/authMiddleware.js";

// const router = express.Router();

// router.post("/:rider_id/wallet/add-money", authMiddleware, riderController.addMoney);

export default router;
