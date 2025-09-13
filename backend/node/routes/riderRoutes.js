//harshit and raksha // funcitonalities: 1. ride history 2. profile management(cloud image upload) 3. saved location (managing) 4. share status(twilio to whatsapp) 5. find a lost item/contact driver or previous rides/register a complaint
//chandana - wallet management 
//error handler

// routes/rider.routes.js
import express from "express";
import * as riderController from "../controllers/riderController.js";
import { addMoney } from '../controllers/riderController.js';

const router = express.Router();

// 1. Ride history
router.get("/history/:riderId", riderController.getRideHistory);

// 2. Profile management
router.get("/profile/:riderId", riderController.getProfile);
router.put("/profile/:riderId", riderController.updateProfile);

// 3. Saved locations (future use, db table yet to come)
router.get("/locations", riderController.getSavedLocations);
router.post("/locations", riderController.addSavedLocation);
router.delete("/locations/:id", riderController.deleteSavedLocation);

// 4. Share ride status (Twilio integration later)
router.post("/share-ride/:rideId", riderController.shareRideStatus);

// 5. Complaints + Lost items
// Complaints + Lost items
router.post("/complaints/:rideId", riderController.registerComplaint);
router.get("/lost-items/:rideId", riderController.getLostItems);


// const router = express.Router();

router.post('/addMoney', addMoney);

export default router;
