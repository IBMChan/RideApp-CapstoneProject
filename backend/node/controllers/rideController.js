// controllers/rideController.js
import RideService from "../services/rideService.js";
import paymentService from "../services/paymentService.js";
import redisClient from "../config/redisConfig.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

class RideController {
  // Rider creates a new ride
  async createRide(req, res) {
    try {
      const rider_id = req.user?.id || 1; // TODO: replace with actual auth
      const { ride, matchedDrivers } = await RideService.createRide(req.body, rider_id);

      const rideData = await redisClient.get(`ride:${ride.ride_id}`);
      const rideFromCache = rideData ? JSON.parse(rideData) : ride;

      // Ensure a payment document is created for this ride (default mode cash for now)
      await paymentService.createPaymentForRide({
        ride_id: ride.ride_id,
        fare: Number(ride.fare || req.body.fare || 0),
        mode: "cash",
      });

      return successResponse(
        res,
        "Ride created successfully. Drivers matched.",
        {
          ride_id: ride.ride_id,
          ride: rideFromCache,
          matchedDrivers,
        },
        201
      );
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }

  // Driver gets pending rides
  async getPendingRides(req, res) {
    try {
      const rides = await RideService.getPendingRidesForDriver();
      return successResponse(res, "Pending rides fetched successfully", { rides });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }

  // Driver accepts a ride
  async acceptRide(req, res) {
    try {
      const { ride_id } = req.params;
      const driver_id = req.user?.id || 18; // fallback for testing
      const ride = await RideService.acceptRide(ride_id, driver_id);
      return successResponse(res, "Ride accepted successfully", { ride });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }

  // Update ride status
  async updateRideStatus(req, res) {
    try {
      const { ride_id } = req.params;
      const { status } = req.body;
      const { id: userId, role } = req.user;

      const ride = await RideService.updateRideStatus(ride_id, status, userId, role);
      return successResponse(res, "Ride status updated successfully", { ride });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }

  // Complete a ride
  async completeRide(req, res) {
    try {
      const { ride_id } = req.params;
      const ride = await RideService.completeRide(ride_id);
      return successResponse(res, "Ride completed successfully", { ride });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }

  // Cancel a ride
  async cancelRide(req, res) {
    try {
      const { ride_id } = req.params;
      const ride = await RideService.cancelRide(ride_id);
      return successResponse(res, "Ride cancelled successfully", { ride });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }

  // Get ongoing rides for a driver
  async getOngoingRides(req, res) {
    try {
      const driver_id = req.user?.id;
      const rides = await RideService.getOngoingRides(driver_id);
      return successResponse(res, "Ongoing rides fetched successfully", { rides });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }

  // Get ride history for a driver
  async getRideHistory(req, res) {
    try {
      const driver_id = req.user?.id;
      const rides = await RideService.getRideHistory(driver_id);
      return successResponse(res, "Ride history fetched successfully", { rides });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }

  // Get details of a single ride
  async getRide(req, res) {
    try {
      const { ride_id } = req.params;
      const ride = await RideService.getRide(ride_id);
      return successResponse(res, "Ride fetched successfully", { ride });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 404);
    }
  }

  // List all rides for a user (rider or driver)
  async listRides(req, res) {
    try {
      const { id: user_id, role } = req.user;
      const rides = await RideService.listRides(user_id, role);
      return successResponse(res, "Rides listed successfully", { rides });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }

  // Rider initiates payment (cash/upi) for a ride
  async processPayment(req, res) {
    try {
      const { ride_id } = req.params;
      const { mode } = req.body;

      if (!mode || !["cash", "upi"].includes(mode)) {
        return errorResponse(res, "mode must be 'cash' or 'upi'", 400);
      }

      const ride = await RideService.getRide(ride_id);
      if (!ride) return errorResponse(res, "Ride not found", 404);

      const allowedStatuses = ["in_progress", "completed"];
      if (!allowedStatuses.includes(ride.status)) {
        return errorResponse(res, "Payment allowed only for ongoing or completed rides", 400);
      }

      const payment = await paymentService.createPaymentForRide({
        ride_id: ride.ride_id,
        fare: Number(ride.fare || 0),
        mode,
      });

      // Notify driver (placeholder - integrate notificationService here)
      console.log(`[NOTIFY] Driver (${ride.driver_id}) confirm collection for payment_id=${payment.payment_id}`);

      return successResponse(res, "Payment initiated (pending, awaiting driver confirmation)", {
        payment,
      });
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }
}

export default new RideController();
