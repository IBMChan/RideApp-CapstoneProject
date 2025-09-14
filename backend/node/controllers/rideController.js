import RideService from "../services/rideService.js";
import paymentService from "../services/paymentService.js";
import redisClient from "../config/redisConfig.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

class RideController {
  async createRide(req, res) {
    try {
      const rider_id = req.user?.user_id;
      const { ride, matchedDrivers } = await RideService.createRide(req.body, rider_id);

      const rideData = await redisClient.get(`ride:${ride.ride_id}`);
      const rideFromCache = rideData ? JSON.parse(rideData) : ride;

      // Ensure payment document is created for this ride (default cash mode)
      await paymentService.createPaymentForRide({
        ride_id: ride.ride_id,
        fare: Number(ride.fare || req.body.fare || 0),
        mode: "cash",
      });

      return successResponse(
        res,
        "Ride created successfully. Drivers matched.",
        { ride_id: ride.ride_id, ride: rideFromCache, matchedDrivers },
        201
      );
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }

  async getPendingRides(req, res) {
    try {
      const driver_id = req.user?.user_id;
      const rides = await RideService.getPendingRidesForDriver(driver_id);
      return successResponse(res, "Pending rides fetched successfully", { rides });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }

  async acceptRide(req, res) {
    try {
      const { ride_id } = req.params;
      const driver_id = req.user?.user_id;
      const ride = await RideService.acceptRide(ride_id, driver_id);
      return successResponse(res, "Ride accepted successfully", { ride });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }

  async updateRideStatus(req, res) {
    try {
      const { ride_id } = req.params;
      const { status } = req.body;
      const { user_id: userId, role } = req.user;
      const ride = await RideService.updateRideStatus(ride_id, status, userId, role);
      return successResponse(res, "Ride status updated successfully", { ride });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }

  async completeRide(req, res) {
    try {
      const { ride_id } = req.params;
      const user = req.user || {};
      const ride = await RideService.completeRide(Number(ride_id), user);
      return successResponse(res, "Ride completed", { ride });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 500);
    }
  }

  async cancelRide(req, res) {
    try {
      const { ride_id } = req.params;
      const ride = await RideService.cancelRide(ride_id);
      return successResponse(res, "Ride cancelled successfully", { ride });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }

  async getOngoingRides(req, res) {
    try {
      const driver_id = req.user?.user_id;
      const rides = await RideService.getOngoingRides(driver_id);
      return successResponse(res, "Ongoing rides fetched successfully", { rides });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }

  async getRideHistory(req, res) {
    try {
      const driver_id = req.user?.user_id;
      const rides = await RideService.getRideHistory(driver_id);
      return successResponse(res, "Ride history fetched successfully", { rides });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }

  async getRide(req, res) {
    try {
      const { ride_id } = req.params;
      const ride = await RideService.getRide(ride_id);
      return successResponse(res, "Ride fetched successfully", { ride });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 404);
    }
  }

  async listRides(req, res) {
    try {
      const { user_id, role } = req.user;
      const rides = await RideService.listRides(user_id, role);
      return successResponse(res, "Rides listed successfully", { rides });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }

  async processPayment(req, res) {
    try {
      const { ride_id } = req.params;
      const { mode } = req.body;

      if (!["cash", "upi", "wallet"].includes(mode)) {
        return errorResponse(res, "Invalid payment mode", 400);
      }

      const ride = await RideService.getRide(Number(ride_id));
      if (!ride) return errorResponse(res, "Ride not found", 404);
      if (!["in_progress", "completed"].includes(ride.status)) {
        return errorResponse(res, "Payment allowed only for ongoing/completed rides", 400);
      }

      const payment = await paymentService.createPaymentForRide({
        ride_id: ride.ride_id,
        fare: Number(ride.fare),
        mode,
      });

      return successResponse(res, "Payment created", { payment });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 500);
    }
  }

  async initiatePayment(req, res) {
    try {
      const { ride_id } = req.params;
      const { mode } = req.body;
      const rider_id = req.user?.user_id;

      const result = await paymentService.initiatePayment({ ride_id, rider_id, mode });
      return successResponse(res, "Payment initiation successful", result);
    } catch (err) {
      console.error("initiatePayment error:", err);
      return errorResponse(res, err, err.statusCode || 500);
    }
  }

  async confirmPayment(req, res) {
    try {
      const { ride_id } = req.params;
      const driver_id = req.user?.user_id;

      const result = await paymentService.confirmPayment({ ride_id, driver_id });
      return successResponse(res, "Payment confirmed", result);
    } catch (err) {
      console.error("confirmPayment error:", err);
      return errorResponse(res, err, err.statusCode || 500);
    }
  }
}

export default new RideController();
