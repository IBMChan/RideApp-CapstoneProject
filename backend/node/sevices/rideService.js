import path from "path";
import { spawn } from "child_process";
import { callPython } from "./pythonService.js";
import redisClient from "../config/redisConfig.js";
import RideRepository from "../repositories/mysql/ridesRepository.js";
import User from "../entities/userModel.js";
import Vehicle from "../entities/vehicleModel.js";

class RideService {
  // ---------------- Rider Methods ----------------
  async createRide(data, rider_id) {
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
    await redisClient.setEx(`ride:${ride.ride_id}`, 300, JSON.stringify(ride));

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
          return reject(new Error("Driver matching failed"));
        }

        try {
          const matchedDrivers = JSON.parse(stdout);
          resolve(matchedDrivers);
        } catch {
          reject(new Error("Invalid matcher output: " + stdout));
        }
      });

      // --------- Provide input to C++ via stdin ---------
      child.stdin.write(`${riders} ${driverCount}\n`);

      // Send driver IDs
      const driverIds = drivers.map(d => d.user_id);
      child.stdin.write(driverIds.join(" ") + "\n");

      // Send cost matrix
      costMatrix.forEach((row) => {
        child.stdin.write(row.join(" ") + "\n");
      });

      child.stdin.end();
    });
  }

  // ---------------- Driver Methods ----------------
  async getPendingRidesForDriver() {
    return await RideRepository.getPendingRides();
  }

  async acceptRide(ride_id, driver_id) {
    const ride = await RideRepository.findById(ride_id);
    if (!ride) throw new Error("Ride not found");
    if (ride.status !== "requested") {
      throw new Error("Ride is not available for acceptance");
    }

    const driverBusy = await RideRepository.findOngoingByDriver(driver_id);
    if (driverBusy) {
      throw new Error("Driver already on another ride");
    }

    return await RideRepository.assignDriver(ride_id, driver_id);
  }

  async updateRideStatus(ride_id, status, userId, role) {
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
    }

    return await RideRepository.updateStatus(ride_id, status);
  }

  async completeRide(ride_id) {
    return await RideRepository.completeRide(ride_id);
  }

  async cancelRide(ride_id) {
    return await RideRepository.cancelRide(ride_id);
  }

  async getOngoingRides(driver_id) {
    return await RideRepository.getOngoingRidesByDriver(driver_id);
  }

  async getRideHistory(driver_id) {
    return await RideRepository.getRideHistoryByDriver(driver_id);
  }

  // ------- General ----------------------------
  async getRide(ride_id) {
    const ride = await RideRepository.findById(ride_id);
    if (!ride) throw new Error("Ride not found");
    return ride;
  }

  async listRides(user_id, role) {
    if (role === "rider") return await RideRepository.findByRider(user_id);
    if (role === "driver") return await RideRepository.findByDriver(user_id);
    throw new Error("Invalid role for listing rides");
  }
}

// --------- Fetch live drivers ---------
async function getDrivers() {
  return await User.findAll({
    where: {
      role: "driver",
      is_live_currently: "yes",
    },
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

export default new RideService();
