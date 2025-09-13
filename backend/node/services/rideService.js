// rideService.js
import path from "path";
import { spawn } from "child_process";
import { callPython } from "./pythonService.js";
import redisClient from "../config/redisConfig.js";
import RideRepository from "../repositories/mysql/ridesRepository.js";
import User from "../entities/userModel.js";
import Vehicle from "../entities/vehicleModel.js";
<<<<<<< HEAD
=======
import AppError from "../utils/appError.js";
>>>>>>> upstream/main

class RideService {
  // ---------------- Rider Methods ----------------
  async createRide(data, rider_id) {
<<<<<<< HEAD
    const { pickup_loc, drop_loc } = data;

    if (!pickup_loc || !drop_loc) {
      throw new Error("Pickup and drop locations are required");
    }

    const existingRide = await RideRepository.findOngoingByRider(rider_id);
    if (existingRide) {
      throw new Error("You already have an ongoing ride");
    }

    // --- Call Python script for distance & fare ---
    let result;
    try {
      result = await callPython("fare", { pickup: pickup_loc, drop: drop_loc });
    } catch (err) {
      console.error("❌ Python error:", err.message);
      throw new Error("Unable to calculate fare and distance");
    }

    if (!result || !result.fare || !result.distance) {
      throw new Error("Python service did not return valid fare/distance");
    }

    // Create ride in DB
    const ride = await RideRepository.create({
      rider_id,
      driver_id: null,
      pickup_loc: JSON.stringify(pickup_loc),
      drop_loc: JSON.stringify(drop_loc),
      fare: result.fare,
      distance: result.distance,
      status: "requested",
    });

    // Save ride in Redis for quick lookup
    if (redisClient) {
      try {
        await redisClient.setEx(`ride:${ride.ride_id}`, 300, JSON.stringify(ride));
      } catch (err) {
        console.error("⚠️ Redis setEx failed:", err.message);
      }
    }

    const matchedDrivers = await this.matchDrivers(ride.ride_id);

    return { ride, matchedDrivers };
  }

  // ---------------- Driver Matching (C++ with Python distances) ----------------
  async matchDrivers(ride_id) {
    const ride = await RideRepository.findById(ride_id);
    if (!ride) throw new Error("Ride not found");

    const pickup = JSON.parse(ride.pickup_loc);
    const drivers = await getDrivers(); // array of driver objects
    if (!drivers || drivers.length === 0) return [];

    // Build cost matrix using Python haversine
    const riders = 1;
    const driverCount = drivers.length;

    const costMatrix = [];
    for (let i = 0; i < riders; i++) {
      const row = [];
      for (let j = 0; j < driverCount; j++) {
        // random driver location near pickup (simulate live location)
        const driverLoc = {
          lat: pickup.lat + (Math.random() - 0.5) * 0.1, // ~±5km
          lng: pickup.lng + (Math.random() - 0.5) * 0.1,
        };

        const result = await callPython("distance", {
          pickup,
          drop: driverLoc,
        });

        row.push(result.distance || 9999); // fallback large distance
=======
    try {
      if (!rider_id) {
        throw new AppError("Rider ID is required", 400, "MISSING_RIDER_ID");
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
        console.error("❌ Python error:", err.message);
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
          console.error("⚠️ Redis setEx failed:", err.message);
        }
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
    const drivers = await getDrivers();
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
>>>>>>> upstream/main
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
          console.error("❌ C++ matcher error:", stderr);
<<<<<<< HEAD
          return reject(new Error("Driver matching failed"));
        }

=======
          return reject(new AppError("Driver matching failed", 500, "MATCHER_ERROR"));
        }
>>>>>>> upstream/main
        try {
          const matchedDrivers = JSON.parse(stdout);
          resolve(matchedDrivers);
        } catch {
<<<<<<< HEAD
          reject(new Error("Invalid matcher output: " + stdout));
        }
      });

      // --------- Provide input to C++ via stdin ---------
      child.stdin.write(`${riders} ${driverCount}\n`);

      // Send driver IDs
      const driverIds = drivers.map((d) => d.user_id);
      child.stdin.write(driverIds.join(" ") + "\n");

      // Send cost matrix
      costMatrix.forEach((row) => {
        child.stdin.write(row.join(" ") + "\n");
      });

=======
          reject(new AppError("Invalid matcher output", 500, "MATCHER_PARSE_ERROR", stdout));
        }
      });

      child.stdin.write(`${riders} ${driverCount}\n`);
      child.stdin.write(drivers.map((d) => d.user_id).join(" ") + "\n");
      costMatrix.forEach((row) => child.stdin.write(row.join(" ") + "\n"));
>>>>>>> upstream/main
      child.stdin.end();
    });
  }

  // ---------------- Driver Methods ----------------
  async getPendingRidesForDriver() {
    return await RideRepository.getPendingRides();
  }

  async acceptRide(ride_id, driver_id) {
<<<<<<< HEAD
    const ride = await RideRepository.findById(ride_id);
    if (!ride) throw new Error("Ride not found");
    if (ride.status !== "requested") {
      throw new Error("Ride is not available for acceptance");
=======
    if (!ride_id) throw new AppError("Ride ID is required", 400, "MISSING_RIDE_ID");
    if (!driver_id) throw new AppError("Driver ID is required", 400, "MISSING_DRIVER_ID");

    const ride = await RideRepository.findById(ride_id);
    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");

    if (ride.status !== "requested") {
      throw new AppError("Ride not available for acceptance", 400, "RIDE_UNAVAILABLE");
>>>>>>> upstream/main
    }

    const driverBusy = await RideRepository.findOngoingByDriver(driver_id);
    if (driverBusy) {
<<<<<<< HEAD
      throw new Error("Driver already on another ride");
=======
      throw new AppError("Driver already on another ride", 409, "DRIVER_BUSY");
>>>>>>> upstream/main
    }

    return await RideRepository.assignDriver(ride_id, driver_id);
  }

  async updateRideStatus(ride_id, status, userId, role) {
<<<<<<< HEAD
    const ride = await RideRepository.findById(ride_id);
    if (!ride) throw new Error("Ride not found");

    const validStatuses = [
      "requested",
      "accepted",
      "in_progress",
      "completed",
      "cancelled",
      "expired",
    ];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Allowed: ${validStatuses.join(", ")}`);
    }

    if (
      role === "driver" &&
      !["accepted", "in_progress", "completed", "cancelled"].includes(status)
    ) {
      throw new Error("Driver cannot set this status");
    }

    if (role === "rider" && status !== "cancelled") {
      throw new Error("Rider can only cancel rides");
=======
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
>>>>>>> upstream/main
    }

    return await RideRepository.updateStatus(ride_id, status);
  }

  async completeRide(ride_id) {
<<<<<<< HEAD
    return await RideRepository.completeRide(ride_id);
  }

  async cancelRide(ride_id) {
    return await RideRepository.cancelRide(ride_id);
  }

  async getOngoingRides(driver_id) {
=======
    if (!ride_id) throw new AppError("Ride ID is required", 400, "MISSING_RIDE_ID");

    const ride = await RideRepository.completeRide(ride_id);
    if (!ride) throw new AppError("Ride not found or cannot be completed", 404, "RIDE_NOT_FOUND");

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
>>>>>>> upstream/main
    return await RideRepository.getOngoingRidesByDriver(driver_id);
  }

  async getRideHistory(driver_id) {
<<<<<<< HEAD
=======
    if (!driver_id) throw new AppError("Driver ID is required to fetch ride history", 400, "MISSING_DRIVER_ID");
>>>>>>> upstream/main
    return await RideRepository.getRideHistoryByDriver(driver_id);
  }

  // ------- General ----------------------------
  async getRide(ride_id) {
<<<<<<< HEAD
    const ride = await RideRepository.findById(ride_id);
    if (!ride) throw new Error("Ride not found");
=======
    if (!ride_id) throw new AppError("Ride ID is required", 400, "MISSING_RIDE_ID");

    const ride = await RideRepository.findById(ride_id);
    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");

>>>>>>> upstream/main
    return ride;
  }

  async listRides(user_id, role) {
<<<<<<< HEAD
    if (role === "rider") return await RideRepository.findByRider(user_id);
    if (role === "driver") return await RideRepository.findByDriver(user_id);
    throw new Error("Invalid role for listing rides");
=======
    if (!user_id) throw new AppError("User ID is required", 400, "MISSING_USER_ID");
    if (!role) throw new AppError("Role is required", 400, "MISSING_ROLE");

    if (role === "rider") return await RideRepository.findByRider(user_id);
    if (role === "driver") return await RideRepository.findByDriver(user_id);

    throw new AppError("Invalid role for listing rides", 400, "INVALID_ROLE");
>>>>>>> upstream/main
  }
}

// --------- Fetch live drivers ---------
async function getDrivers() {
  return await User.findAll({
<<<<<<< HEAD
    where: {
      role: "driver",
      is_live_currently: "yes",
    },
=======
    where: { role: "driver", is_live_currently: "yes" },
>>>>>>> upstream/main
    attributes: ["user_id", "full_name", "phone"],
    include: [
      {
        model: Vehicle,
        attributes: ["make", "model", "vehicle_id"],
        required: false,
      },
    ],
  });
}

<<<<<<< HEAD
export default new RideService();
=======
export default new RideService();
>>>>>>> upstream/main
