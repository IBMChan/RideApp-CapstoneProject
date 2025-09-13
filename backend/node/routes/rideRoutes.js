//laxmikanth: notification(email(smtp) - phone (firebase))
//prathik : book ride - ride accpet - ride cancel - basic functionalities wrt ride
//payment(paypal) and rating functionalities(r_to_d, d_to_r)

// ride.routes.js
import express from "express";
import RideController from "../controllers/rideController.js";

const router = express.Router();

// Rider
router.post("/create", RideController.createRide);
// Example Request:
// {
//   "pickup_loc": {"lat": 22.32, "lng": 73.15},
//   "drop_loc": {"lat": 22.40, "lng": 73.22}
// }
// Example Response:
// {
//   "success": true,
//   "message": "Ride created successfully. Drivers matched.",
//   "ride_id": 81,
//   "ride": {
//     "ride_date": "2025-09-12T17:50:25.706Z",
//     "ride_id": 81,
//     "rider_id": 1,
//     "pickup_loc": "{\"lat\":22.32,\"lng\":73.15}",
//     "drop_loc": "{\"lat\":22.4,\"lng\":73.22}",
//     "distance": 11.44,
//     "fare": 171.65,
//     "vehicle_id": null,
//     "status": "requested",
//     "expiry_time": "2025-09-12T17:55:25.706Z"
//   },
//   "matchedDrivers": {
//     "assignments": [
//       {
//         "rider": 1,
//         "drivers": [
//           {
//             "driver_id": 14,
//             "distance": 0.56
//           },
//           {
//             "driver_id": 9,
//             "distance": 0.6
//           },
//           {
//             "driver_id": 15,
//             "distance": 2.17
//           }
//         ]
//       }
//     ]
//   }
// }

// Driver
router.post("/accept/:ride_id", RideController.acceptRide); // Here, no body needed. driver_id will be taken from auth. (req.user?.id)
router.post("/cancel/:ride_id", RideController.cancelRide); // No body here
router.get("/pending", RideController.getPendingRides);
router.get("/ongoing", RideController.getOngoingRides);
router.get("/history", RideController.getRideHistory);

// General
router.get("/list/:role", RideController.listRides);
router.get("/:ride_id", RideController.getRide);

export default router;