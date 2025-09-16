// rideService.js

import redisClient from "../config/redisConfig.js";
import RideRepository from "../repositories/mysql/ridesRepository.js";
import AppError from "../utils/appError.js";
import userRepository from "../repositories/mysql/userRepository.js";
// import WalletService from "./walletService.js";
// import paymentService from "./paymentService.js";
import { callPython } from "./pythonService.js";
import path from "path";
import { spawn } from 'child_process';
import vehicleRepository from "../repositories/mysql/vehicleRepository.js";
import crypto from "crypto";
// import notificationService from "./notificationService"; // Optional notifications

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

    // --- Call Python to calculate distance and fare ---
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
// In rideService.js, add debugging around line 49-60
const pin = crypto.randomInt(100000, 999999).toString();
console.log("Generated PIN:", pin);

const ride = await RideRepository.create({
  rider_id,
  driver_id: null,
  pickup_loc: JSON.stringify(pickup_loc),
  drop_loc: JSON.stringify(drop_loc),
  fare: result.fare,
  distance: result.distance,
  status: "requested",
  ride_pin: pin
});

console.log("Ride created with PIN:", ride.ride_pin);

   
    if (redisClient) {
      try {
        await redisClient.setEx(`ride:${ride.ride_id}`, 300, JSON.stringify(ride));
      } catch (err) {
        console.error("Redis setEx failed:", err.message);
      }
    }

    // Ensure a payment document exists for this ride (default mode = 'cash')
    // try {
    //   await paymentService.createPaymentForRide({
    //     ride_id: ride.ride_id,
    //     fare: Number(ride.fare || 0),
    //     mode: "cash",
    //   });
    // } catch (err) {
    //   console.error("Failed to create payment doc for ride:", err.message);
    // }

    delete ride.dataValues.ride_pin;

    const matchedDrivers = await this.matchDrivers(ride.ride_id);

    // Get rider details for the notification
    const rider = await userRepository.findById(rider_id);

    // Send notification to matched drivers
    if (matchedDrivers && matchedDrivers.length > 0) {
      try {
        // Import the notification service
        const { sendRideRequestToDriver } = await import("./notificationService.js");
        
        // For each matched driver, send a notification
        for (const driverId of matchedDrivers) {
          const driver = await userRepository.findById(driverId);
          if (driver && driver.email) {
            await sendRideRequestToDriver(
              driver.email,
              ride,
              rider
            );
            console.log(`Ride request notification sent to driver ${driver.full_name} (${driver.email})`);
          }
        }
      } catch (error) {
        console.error("Failed to send driver notifications:", error.message);
        // Don't throw error here, just log it - we don't want to fail the ride creation
      }
    }

    return { ride, matchedDrivers };
  } catch (err) {
    if (!(err instanceof AppError)) {
      throw new AppError(err.message || "Ride creation failed", 500, "RIDE_CREATION_ERROR");
    }
    throw err;
  }
}

  // async createRide(data, rider_id) {
  //   try {
  //     const isRider = await userRepository.isRider(rider_id);
  //     if (!isRider) {
  //       throw new AppError("Only riders can create a ride", 403, "RIDER_VALIDATION_ERROR");
  //     }

  //     const { pickup_loc, drop_loc } = data || {};
  //     if (!pickup_loc || !drop_loc) {
  //       throw new AppError("Pickup and drop locations are required", 422, "VALIDATION_ERROR");
  //     }

  //     const existingRide = await RideRepository.findOngoingByRider(rider_id);
  //     if (existingRide) {
  //       throw new AppError("You already have an ongoing ride", 409, "RIDE_ALREADY_EXISTS");
  //     }

  //     // --- Call Python to calculate distance and fare ---
  //     let result;
  //     try {
  //       result = await callPython("fare", { pickup: pickup_loc, drop: drop_loc });
  //     } catch (err) {
  //       console.error("PYTHON error:", err.message);
  //       throw new AppError("Unable to calculate fare and distance", 500, "PYTHON_SERVICE_ERROR");
  //     }

  //     if (!result?.fare || !result?.distance) {
  //       throw new AppError("Invalid fare/distance returned from Python service", 500, "FARE_CALC_ERROR");
  //     }

  //     const pin = crypto.randomInt(100000, 999999).toString();
  //     console.log(pin);

  //     const ride = await RideRepository.create({
  //       rider_id,
  //       driver_id: null,
  //       pickup_loc: JSON.stringify(pickup_loc),
  //       drop_loc: JSON.stringify(drop_loc),
  //       fare: result.fare,
  //       distance: result.distance,
  //       status: "requested",
  //       ride_pin: pin
  //     });

  //     if (redisClient) {
  //       try {
  //         await redisClient.setEx(`ride:${ride.ride_id}`, 300, JSON.stringify(ride));
  //       } catch (err) {
  //         console.error("Redis setEx failed:", err.message);
  //       }
  //     }

  //     // Ensure a payment document exists for this ride (default mode = 'cash')
  //     // try {
  //     //   await paymentService.createPaymentForRide({
  //     //     ride_id: ride.ride_id,
  //     //     fare: Number(ride.fare || 0),
  //     //     mode: "cash",
  //     //   });
  //     // } catch (err) {
  //     //   console.error("Failed to create payment doc for ride:", err.message);
  //     // }

  //     delete ride.dataValues.ride_pin;

  //     // const rideWithoutPin = {
  //     //   "ride_id": ride.ride_id,
  //     //   "rider_id": ride.rider_id,
  //     //   "driver_id": ride.driver_id,
  //     //   "vehicle_id": ride.vehicle_id,
  //     //   "pickup_loc": ride.pickup_loc,
  //     //   "drop_loc": ride.drop_loc,
  //     //   "fare": ride.fare,
  //     //   "distance": ride.distance,
  //     //   "status": ride.status,
  //     //   "ride_date": ride.ride_date,
  //     //   "expiry_time": ride.expiry_time,
  //     // };

  //     const matchedDrivers = await this.matchDrivers(ride.ride_id);
  //     return { ride, matchedDrivers };
  //   } catch (err) {
  //     if (!(err instanceof AppError)) {
  //       throw new AppError(err.message || "Ride creation failed", 500, "RIDE_CREATION_ERROR");
  //     }
  //     throw err;
  //   }
  // }

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

    console.log(riders, driverCount);
    console.log(costMatrix);

    console.log(riders, driverCount);
    console.log(costMatrix);

    return new Promise((resolve, reject) => {
      const matcherPath = path.resolve(
        "./cpp/matcher.exe"
        // "./cpp/matcher" + (process.platform === "win32" ? ".exe" : "")
      );
      const child = spawn(matcherPath);
      console.log(matcherPath);
      console.log(matcherPath);

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => (stdout += data.toString()));
      child.stderr.on("data", (data) => (stderr += data.toString()));

      child.on("close", (code) => {
        console.log(code);
        if (code !== 0) {
          console.error("C++ matcher error:",code, stderr);
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

  // async acceptRide(ride_id, driver_id) {
  //   if (!ride_id) throw new AppError("Ride ID is required", 400, "MISSING_RIDE_ID");
  //   if (!driver_id) throw new AppError("Driver ID is required", 400, "MISSING_DRIVER_ID");

  //   const ride = await RideRepository.findById(ride_id);
  //   if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");

  //   const isDriver = await userRepository.isDriver(driver_id);
  //   if (!isDriver) {
  //     throw new AppError("Only Drivers can accept a ride", 403, "RIDER_VALIDATION_ERROR");
  //   }

  //   if (ride.status !== "requested") {
  //     throw new AppError("Ride not available for acceptance", 400, "RIDE_UNAVAILABLE");
  //   }

  //   const driverBusy = await RideRepository.findOngoingByDriver(driver_id);
  //   if (driverBusy) {
  //     throw new AppError("Driver already on another ride", 409, "DRIVER_BUSY");
  //   }

  //   // Find driver's active vehicle
  //   const activeVehicle = await vehicleRepository.getActiveByDriver(driver_id);
  //   if (!activeVehicle) {
  //     throw new AppError("Driver has no active vehicle. Set one active before accepting rides.", 400, "NO_ACTIVE_VEHICLE");
  //   }

  //   // Assign driver and vehicle atomically (rideRepository.assignDriver should accept vehicle_id)
    
  //   const res = await RideRepository.assignDriver(ride_id, driver_id, activeVehicle.vehicle_id);

  //   // email
  //   console.log("email sent");

  //   return res;
  // }


  // Modify the acceptRide method in rideService.js


  // Modify the acceptRide method in rideService.js
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

  // Find driver's active vehicle
  const activeVehicle = await vehicleRepository.getActiveByDriver(driver_id);
  if (!activeVehicle) {
    throw new AppError("Driver has no active vehicle. Set one active before accepting rides.", 400, "NO_ACTIVE_VEHICLE");
  }

  // Check if ride_pin is null and generate a new one if needed
  let ride_pin = ride.ride_pin;
  if (!ride_pin) {
    ride_pin = crypto.randomInt(100000, 999999).toString();
    console.log("Generated new PIN in acceptRide:", ride_pin);
    
    // Update the ride with the new PIN
    await ride.update({ ride_pin });
    console.log("Updated ride with new PIN in database");
  }

  // Assign driver and vehicle atomically
  const updatedRide = await RideRepository.assignDriver(ride_id, driver_id, activeVehicle.vehicle_id);
  
  // Add the ride_pin back to the updated ride for the email
  updatedRide.ride_pin = ride_pin;

  // Get rider details to send email
  const rider = await userRepository.findById(ride.rider_id);
  if (rider && rider.email) {
    // Import the notification service
    const { sendRideAcceptanceEmail } = await import("./notificationService.js");
    
    // Send email notification to rider with the OTP
    await sendRideAcceptanceEmail(
      rider.email, 
      updatedRide, 
      activeVehicle
    );
    
    console.log("Ride acceptance email with OTP sent to rider");
  } else {
    console.error("Could not send email: Rider email not found");
  }

  // Remove the ride_pin from the response to maintain security
  delete updatedRide.dataValues.ride_pin;
  
  return updatedRide;
} 

async updateRideStatus(ride_id, status, userId, role, pin = null) {
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

  if (status === "in_progress" && role === "driver") {
    const updated = await RideRepository.updateStatus(ride_id, "in_progress", pin);
    if (!updated) throw new AppError("Invalid PIN. Cannot start ride.", 400, "INVALID_PIN");
    
    // Send status change email to rider
    try {
      // Get rider details
      const rider = await userRepository.findById(ride.rider_id);
      if (rider && rider.email) {
        // Import the notification service
        const { sendRideStatusChangeEmail } = await import("./notificationService.js");
        
        // Send email notification to rider
        await sendRideStatusChangeEmail(
          rider.email,
          updated
        );
        
        console.log("Ride status change email sent to rider");
      }
    } catch (error) {
      console.error("Failed to send status change email:", error.message);
      // Don't throw error here, just log it - we don't want to fail the status update
    }
    
    return updated;
  }

  return await RideRepository.updateStatus(ride_id, status);
}

async completeRide(ride_id) {
  if (!ride_id) throw new AppError("Missing ride_id", 400);

  // Get the ride before updating its status
  const rideBeforeUpdate = await RideRepository.findById(ride_id);
  if (!rideBeforeUpdate) throw new AppError("Ride not found", 404);

  // Complete the ride
  const ride = await RideRepository.completeRide(ride_id);
  if (!ride) throw new AppError("Ride not found", 404);

  try {
    // Get rider details
    const rider = await userRepository.findById(ride.rider_id);
    
    // Get driver details
    const driver = await userRepository.findById(ride.driver_id);
    
    if (rider && rider.email && driver) {
      // Import the notification service
      const { sendRideCompletionEmail } = await import("./notificationService.js");
      
      // Send email notification to rider with the receipt
      await sendRideCompletionEmail(
        rider.email,
        ride,
        driver
      );
      
      console.log("Ride completion email with receipt sent to rider");
    } else {
      console.error("Could not send completion email: Rider email or driver details not found");
    }
  } catch (error) {
    console.error("Failed to send ride completion email:", error.message);
    // Don't throw error here, just log it - we don't want to fail the ride completion
  }

  // Handle payment logic if needed
  // const payment = await paymentService.getPaymentByRide(ride.ride_id);
  // if (payment && payment.mode === "wallet" && payment.status === "pending") {
  //   try {
  //     const debitResult = await paymentService.debitWalletForRide(ride.rider_id, Number(ride.fare), ride.ride_id);
  //     if (debitResult && debitResult.success) {
  //       await paymentService.confirmPaymentByDriver(ride.ride_id); // mark payment success
  //     } else {
  //       console.error("Debit failed:", debitResult);
  //     }
  //   } catch (err) {
  //     console.error("debit exception:", err);
  //   }
  // } else {
  //   if (!payment) {
  //     await paymentService.createPaymentForRide({
  //       ride_id: ride.ride_id,
  //       fare: ride.fare,
  //       mode: "cash",
  //     });
  //   }
  // }

  return ride;
}







  // async updateRideStatus(ride_id, status, userId, role, pin = null) {
  //   if (!ride_id) throw new AppError("Ride ID is required", 400, "MISSING_RIDE_ID");
  //   if (!status) throw new AppError("Status is required", 400, "MISSING_STATUS");
  //   if (!userId) throw new AppError("User ID is required", 400, "MISSING_USER_ID");

  //   const ride = await RideRepository.findById(ride_id);
  //   if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");

  //   const validStatuses = ["requested", "accepted", "in_progress", "completed", "cancelled", "expired"];
  //   if (!validStatuses.includes(status)) {
  //     throw new AppError(`Invalid status. Allowed: ${validStatuses.join(", ")}`, 422, "INVALID_STATUS");
  //   }

  //   if (role === "driver" && !["accepted", "in_progress", "completed", "cancelled"].includes(status)) {
  //     throw new AppError("Driver cannot set this status", 403, "STATUS_FORBIDDEN");
  //   }
  //   if (role === "rider" && status !== "cancelled") {
  //     throw new AppError("Rider can only cancel rides", 403, "STATUS_FORBIDDEN");
  //   }

  //   if (status === "in_progress" && role === "driver") {
  //     const updated = await RideRepository.updateStatus(ride_id, "in_progress", pin);
  //     if (!updated) throw new AppError("Invalid PIN. Cannot start ride.", 400, "INVALID_PIN");
  //     return updated;
  //   }

  //   return await RideRepository.updateStatus(ride_id, status);
  // }

  // async completeRide(ride_id) {
  //   if (!ride_id) throw new AppError("Missing ride_id", 400);

  //   const ride = await RideRepository.completeRide(ride_id);
  //   if (!ride) throw new AppError("Ride not found", 404);

  //   // const payment = await paymentService.getPaymentByRide(ride.ride_id);
  //   // if (payment && payment.mode === "wallet" && payment.status === "pending") {
  //   //   try {
  //   //     const debitResult = await paymentService.debitWalletForRide(ride.rider_id, Number(ride.fare), ride.ride_id);
  //   //     if (debitResult && debitResult.success) {
  //   //       await paymentService.confirmPaymentByDriver(ride.ride_id); // mark payment success
  //   //     } else {
  //   //       console.error("Debit failed:", debitResult);
  //   //     }
  //   //   } catch (err) {
  //   //     console.error("debit exception:", err);
  //   //   }
  //   // } else {
  //   //   if (!payment) {
  //   //     await paymentService.createPaymentForRide({
  //   //       ride_id: ride.ride_id,
  //   //       fare: ride.fare,
  //   //       mode: "cash",
  //   //     });
  //   //   }
  //   // }

  //   return ride;
  // }

  // cancelRide: if cancel happens BEFORE expiry_time, unassign driver & vehicle and set status back to 'requested' (so re-matching can occur).
  // Otherwise mark cancelled.
  
  async cancelRide(ride_id, userId = null, role = null) {
    if (!ride_id) throw new AppError("Ride ID is required", 400, "MISSING_RIDE_ID");

    const ride = await RideRepository.findById(ride_id);
    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");

    // optional: authorization - allow rider who created the ride or assigned driver to cancel
    if (userId) {
      const allowed =
        role === "admin" ||
        ride.rider_id === Number(userId) ||
        (ride.driver_id && ride.driver_id === Number(userId));
      if (!allowed) {
        throw new AppError("Not authorized to cancel this ride", 403, "UNAUTHORIZED");
      }
    }

    const now = new Date();
    const expiry = ride.expiry_time ? new Date(ride.expiry_time) : null;

    if (expiry && now < expiry) {
      // Revert to requested and remove assignment
      await RideRepository.clearSensitiveFields(ride_id);
      await ride.update({
        status: "requested",
      });
      return ride;
    } else {
      // Past expiry -> cancel permanently
      await RideRepository.clearSensitiveFields(ride_id);
      const cancelled = await RideRepository.cancelRide(ride_id);
      if (!cancelled) throw new AppError("Unable to cancel ride", 500, "CANCEL_FAILED");
      return cancelled;
    }
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
}

export default new RideService();