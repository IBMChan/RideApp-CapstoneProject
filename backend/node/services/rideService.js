// services/rideService.js
import path from "path";
import { spawn } from "child_process";
import { callPython } from "./pythonService.js";
import redisClient from "../config/redisConfig.js";
import RideRepository from "../repositories/mysql/ridesRepository.js";
import AppError from "../utils/appError.js";
import userRepository from "../repositories/mysql/userRepository.js";

import paymentService from "./paymentService.js";
// import notificationService from "./notificationService";

class RideService {
  // ---------------- Rider Methods ----------------
  async createRide(data, rider_id) {
    try {
      const isRider = await userRepository.isRider(rider_id);
      if (!isRider) {
        throw new AppError("Only riders can create a ride", 403, "RIDER_VALIDATION_ERROR");
      }

      const { pickup_loc, drop_loc } = data || {};
      if (!pickup_loc || !drop_loc) {
        throw new AppError("Pickup and drop locations are required", 422, "VALIDATION_ERROR");
      }

      const existingRide = await RideRepository.findOngoingByRider(rider_id);
      if (existingRide) {
        throw new AppError("You already have an ongoing ride", 409, "RIDE_ALREADY_EXISTS");
      }

      // --- Call Python script for distance & fare ---
      let result;
      try {
        result = await callPython("fare", { pickup: pickup_loc, drop: drop_loc });
      } catch (err) {
        console.error("PYTHON error:", err.message);
        throw new AppError("Unable to calculate fare and distance", 500, "PYTHON_SERVICE_ERROR");
      }

      if (!result?.fare || !result?.distance) {
        throw new AppError("Invalid fare/distance returned from Python service", 500, "FARE_CALC_ERROR");
      }

      const ride = await RideRepository.create({
        rider_id,
        driver_id: null,
        pickup_loc: JSON.stringify(pickup_loc),
        drop_loc: JSON.stringify(drop_loc),
        fare: result.fare,
        distance: result.distance,
        status: "requested",
      });

      if (redisClient) {
        try {
          await redisClient.setEx(`ride:${ride.ride_id}`, 300, JSON.stringify(ride));
        } catch (err) {
          console.error("Redis setEx failed:", err.message);
        }
      }

      // ensure a payment document exists for every ride (default mode = 'cash')
      try {
        await paymentService.createPaymentForRide({
          ride_id: ride.ride_id,
          fare: Number(ride.fare || 0),
          mode: "cash",
        });
      } catch (err) {
        // don't fail ride creation if payment doc creation fails — log and continue
        console.error("Failed to create payment doc for ride:", err.message);
      }

      const matchedDrivers = await this.matchDrivers(ride.ride_id);
      return { ride, matchedDrivers };
    } catch (err) {
      if (!(err instanceof AppError)) {
        throw new AppError(err.message || "Ride creation failed", 500, "RIDE_CREATION_ERROR");
      }
      throw err;
    }
  }

  // ---------------- Driver Matching ----------------
  async matchDrivers(ride_id) {
    if (!ride_id) throw new AppError("Ride ID is required", 400, "MISSING_RIDE_ID");

    const ride = await RideRepository.findById(ride_id);
    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");

    const pickup = JSON.parse(ride.pickup_loc);
    const drivers = await userRepository.getDrivers();
    if (!drivers?.length) {
      throw new AppError("No live drivers available", 404, "NO_DRIVERS_AVAILABLE");
    }

    const riders = 1;
    const driverCount = drivers.length;
    const costMatrix = [];

    for (let i = 0; i < riders; i++) {
      const row = [];
      for (let j = 0; j < driverCount; j++) {
        const driverLoc = {
          lat: pickup.lat + (Math.random() - 0.5) * 0.1,
          lng: pickup.lng + (Math.random() - 0.5) * 0.1,
        };
        const result = await callPython("distance", { pickup, drop: driverLoc });
        row.push(result?.distance || 9999);
      }
      costMatrix.push(row);
    }

    return new Promise((resolve, reject) => {
      const matcherPath = path.resolve(
        "./cpp/matcher" + (process.platform === "win32" ? ".exe" : "")
      );
      const child = spawn(matcherPath);

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => (stdout += data.toString()));
      child.stderr.on("data", (data) => (stderr += data.toString()));

      child.on("close", (code) => {
        if (code !== 0) {
          console.error("C++ matcher error:", stderr);
          return reject(new AppError("Driver matching failed", 500, "MATCHER_ERROR"));
        }
        try {
          const matchedDrivers = JSON.parse(stdout);
          resolve(matchedDrivers);
        } catch {
          reject(new AppError("Invalid matcher output", 500, "MATCHER_PARSE_ERROR", stdout));
        }
      });

      child.stdin.write(`${riders} ${driverCount}\n`);
      child.stdin.write(drivers.map((d) => d.user_id).join(" ") + "\n");
      costMatrix.forEach((row) => child.stdin.write(row.join(" ") + "\n"));
      child.stdin.end();
    });
  }

  // ---------------- Driver Methods ----------------
  async getPendingRidesForDriver(driver_id) {
    if (!driver_id) throw new AppError("Driver ID is required to fetch ongoing rides", 400, "MISSING_DRIVER_ID");
    const isDriver = await userRepository.isDriver(driver_id);
    if (!isDriver) {
      throw new AppError("Only Drivers can see the pending Rides", 403, "RIDER_VALIDATION_ERROR");
    }
    return await RideRepository.getPendingRides();
  }

  async acceptRide(ride_id, driver_id) {
    if (!ride_id) throw new AppError("Ride ID is required", 400, "MISSING_RIDE_ID");
    if (!driver_id) throw new AppError("Driver ID is required", 400, "MISSING_DRIVER_ID");

    const ride = await RideRepository.findById(ride_id);
    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");

    const isDriver = await userRepository.isDriver(driver_id);
    if (!isDriver) {
      throw new AppError("Only Drivers can accept a ride", 403, "RIDER_VALIDATION_ERROR");
    }

    if (ride.status !== "requested") {
      throw new AppError("Ride not available for acceptance", 400, "RIDE_UNAVAILABLE");
    }

    const driverBusy = await RideRepository.findOngoingByDriver(driver_id);
    if (driverBusy) {
      throw new AppError("Driver already on another ride", 409, "DRIVER_BUSY");
    }

    return await RideRepository.assignDriver(ride_id, driver_id);
  }

  async updateRideStatus(ride_id, status, userId, role) {
    if (!ride_id) throw new AppError("Ride ID is required", 400, "MISSING_RIDE_ID");
    if (!status) throw new AppError("Status is required", 400, "MISSING_STATUS");
    if (!userId) throw new AppError("User ID is required", 400, "MISSING_USER_ID");

    const ride = await RideRepository.findById(ride_id);
    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");

    const validStatuses = ["requested", "accepted", "in_progress", "completed", "cancelled", "expired"];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Allowed: ${validStatuses.join(", ")}`, 422, "INVALID_STATUS");
    }

    if (role === "driver" && !["accepted", "in_progress", "completed", "cancelled"].includes(status)) {
      throw new AppError("Driver cannot set this status", 403, "STATUS_FORBIDDEN");
    }

    if (role === "rider" && status !== "cancelled") {
      throw new AppError("Rider can only cancel rides", 403, "STATUS_FORBIDDEN");
    }

    return await RideRepository.updateStatus(ride_id, status);
  }

  async completeRide(ride_id) {
    if (!ride_id) throw new AppError("Ride ID is required", 400, "MISSING_RIDE_ID");

    const ride = await RideRepository.completeRide(ride_id);
    if (!ride) throw new AppError("Ride not found or cannot be completed", 404, "RIDE_NOT_FOUND");

    // business action: when ride completes we can create/ensure payment doc and notify driver that collection is required for cash/upi
    try {
      const payment = await paymentService.createPaymentForRide({
        ride_id: ride.ride_id,
        fare: Number(ride.fare || 0),
        mode: "cash", // default; controllers can override if rider requested UPI
      });

      // notify driver (use notificationService if available)
      try {
        if (ride.driver_id && notificationService?.notifyDriver) {
          await notificationService.notifyDriver(ride.driver_id, {
            title: "Payment pending",
            body: `Payment ${payment.payment_id} pending for ride ${ride.ride_id}. Please confirm when collected.`,
            payment_id: payment.payment_id,
            ride_id: ride.ride_id,
          });
        } else {
          console.log(`Notify driver ${ride.driver_id}: confirm payment ${payment.payment_id} for ride ${ride.ride_id}`);
        }
      } catch (notifyErr) {
        console.error("Failed to notify driver about payment:", notifyErr.message);
      }
    } catch (err) {
      console.error("Failed to ensure payment on ride completion:", err.message);
      // don't block ride completion if payment doc creation fails
    }

    return ride;
  }

  async cancelRide(ride_id) {
    if (!ride_id) throw new AppError("Ride ID is required", 400, "MISSING_RIDE_ID");

    const ride = await RideRepository.cancelRide(ride_id);
    if (!ride) throw new AppError("Ride not found or cannot be cancelled", 404, "RIDE_NOT_FOUND");

    return ride;
  }

  async getOngoingRides(driver_id) {
    if (!driver_id) throw new AppError("Driver ID is required to fetch ongoing rides", 400, "MISSING_DRIVER_ID");
    const isDriver = await userRepository.isDriver(driver_id);
    if (!isDriver) {
      throw new AppError("Only Drivers can get the Ongoing rides", 403, "RIDER_VALIDATION_ERROR");
    }
    return await RideRepository.getOngoingRidesByDriver(driver_id);
  }

  async getRideHistory(driver_id) {
    if (!driver_id) throw new AppError("Driver ID is required to fetch ride history", 400, "MISSING_DRIVER_ID");
    const isDriver = await userRepository.isDriver(driver_id);
    if (!isDriver) {
      throw new AppError("Only Drivers can get the Ride History", 403, "RIDER_VALIDATION_ERROR");
    }
    return await RideRepository.getRideHistoryByDriver(driver_id);
  }

  // ------- General ----------------------------
  async getRide(ride_id) {
    if (!ride_id) throw new AppError("Ride ID is required", 400, "MISSING_RIDE_ID");

    const ride = await RideRepository.findById(ride_id);
    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");

    return ride;
  }

  async listRides(user_id, role) {
    if (!user_id) throw new AppError("User ID is required", 400, "MISSING_USER_ID");
    if (!role) throw new AppError("Role is required", 400, "MISSING_ROLE");

    if (role === "rider") return await RideRepository.findByRider(user_id);
    if (role === "driver") return await RideRepository.findByDriver(user_id);

    throw new AppError("Invalid role for listing rides", 400, "INVALID_ROLE");
  }

  // ---------------- Payment-related business logic ----------------

  /**
   * Initiate a payment for a ride (cash / upi)
   * - Only allowed if ride status is in_progress or completed
   * - Creates a payment doc (pending) and notifies the driver for manual confirmation
   */
  async initiatePayment(ride_id, mode = "cash") {
    if (!ride_id) throw new AppError("Ride ID is required", 400, "MISSING_RIDE_ID");
    if (!["cash", "upi"].includes(mode)) throw new AppError("Unsupported mode", 422, "INVALID_MODE");

    const ride = await RideRepository.findById(ride_id);
    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");

    const allowedStatuses = ["in_progress", "completed"];
    if (!allowedStatuses.includes(ride.status)) {
      throw new AppError("Payment can only be initiated for ongoing or completed rides", 400, "INVALID_RIDE_STATUS");
    }

    // create or return existing payment document
    const payment = await paymentService.createPaymentForRide({
      ride_id: ride.ride_id,
      fare: Number(ride.fare || 0),
      mode,
    });

    // notify driver
    try {
      if (ride.driver_id && notificationService?.notifyDriver) {
        await notificationService.notifyDriver(ride.driver_id, {
          title: "Payment collection requested",
          body: `Please confirm collection for payment ${payment.payment_id} (ride ${ride.ride_id})`,
          payment_id: payment.payment_id,
          ride_id: ride.ride_id,
        });
      } else {
        console.log(`Notify driver ${ride.driver_id}: confirm payment ${payment.payment_id} for ride ${ride.ride_id}`);
      }
    } catch (err) {
      console.error("Notification failed:", err.message);
    }

    return payment;
  }

  /**
   * Driver confirms a cash/upi payment. Validates that:
   * - payment exists
   * - associated ride exists and belongs to the driver
   * - payment is pending (or not already success)
   */
  async confirmPayment(payment_id, driver_id) {
    if (!payment_id) throw new AppError("Payment ID is required", 400, "MISSING_PAYMENT_ID");
    if (!driver_id) throw new AppError("Driver ID is required", 400, "MISSING_DRIVER_ID");

    const payment = await paymentService.getPaymentByRide(payment_id) // careful: this returns by ride_id in some implementations
      .catch(() => null);

    // paymentService in your code exposes findById/paymentRepository.findById. We'll prefer paymentService.findById if implemented.
    // To be robust, attempt multiple ways:
    let paymentDoc = null;
    if (payment && payment.payment_id === Number(payment_id)) {
      paymentDoc = payment;
    } else {
      // try paymentService.findById if present
      if (typeof paymentService.findById === "function") {
        paymentDoc = await paymentService.findById(Number(payment_id));
      } else {
        // fallback: query the payment repository directly (assumes it exists)
        // require repository lazily to avoid circular imports in some setups
        const paymentRepo = await import("../repositories/mongodb/paymentRepository.js").then(m => m.default);
        paymentDoc = await paymentRepo.findById(Number(payment_id));
      }
    }

    if (!paymentDoc) throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");

    // get ride linked to payment
    const ride = await RideRepository.findById(paymentDoc.ride_id);
    if (!ride) throw new AppError("Associated ride not found", 404, "RIDE_NOT_FOUND");

    if (ride.driver_id !== Number(driver_id)) {
      throw new AppError("Driver not authorized to confirm this payment", 403, "UNAUTHORIZED_DRIVER");
    }

    if (paymentDoc.status === "success") {
      // already confirmed
      return paymentDoc;
    }

    // perform confirmation
    const updated = await paymentService.confirmPaymentByDriver(Number(payment_id), Number(driver_id));
    return updated;
  }

  /**
   * Get pending payments awaiting driver confirmation for a driver
   * Returns array of { ride, payment }
   */
  async getPendingPaymentsForDriver(driver_id) {
    if (!driver_id) throw new AppError("Driver ID required", 400, "MISSING_DRIVER_ID");

    // fetch ongoing rides for driver
    const rides = await RideRepository.getOngoingRidesByDriver(driver_id);
    const pending = [];

    for (const ride of rides) {
      // fetch payment for this ride (if exists)
      const payment = await paymentService.getPaymentByRide(ride.ride_id).catch(() => null);
      if (payment && payment.status === "pending" && ["cash", "upi"].includes(payment.mode)) {
        pending.push({ ride, payment });
      }
    }

    return pending;
  }
}



export default new RideService();
