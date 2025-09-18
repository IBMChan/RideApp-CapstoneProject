// shriya : profile managemnet, ride history, payment history, vahicle management, dr_status management(online, offline) , register a complaint  
//chandana - wallet management

import userRepository from "../repositories/mysql/userRepository.js";
import vehicleRepository from "../repositories/mysql/vehicleRepository.js";
import RatingRepository from "../repositories/mongodb/ratingRepository.js";
import PaymentRepository from "../repositories/mongodb/paymentRepository.js"
import vehicleService from "./vehicleService.js";
import walletRepository from "../repositories/postgres/walletRepository.js";
import walletTransactionRepository from "../repositories/postgres/walletTransactionRepository.js";
import paymentService from "./paymentService.js";

class DriverService {
  // ===== Profile =====
  async getProfile(driverId) {
    const driver = await userRepository.findById(driverId);
    if (!driver) throw new Error("Driver not found");
    return driver;
  }

  async updateProfile(driverId, fields) {
    const allowedFields = ["full_name", "phone", "email"];
    const updates = {};
    if (!fields || typeof fields !== 'object') {
      throw new Error("Invalid input data");
    }
    for (const key of allowedFields) {
      if (fields[key]) updates[key] = fields[key];
    }

    if (Object.keys(updates).length === 0) {
      throw new Error("No valid fields provided for update");
    }

    if (updates.phone && !/^[0-9]{10}$/.test(updates.phone)) {
      throw new Error("Phone number must be 10 digits");
    }
    if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
      throw new Error("Invalid email format");
    }

    return await userRepository.update(driverId, updates);
  }

  // ===== Ride History =====
  async getRideHistory(driverId) {
    return await userRepository.findRidesByDriver(driverId);
  }
  // ==== Average Rating =====
  async getAverageRating(driverId) {
    return await RatingRepository.getAverageRatingByDriver(driverId);
  }
  // ===== Payment History =====
  async getPaymentHistory(driverId) {
    return await PaymentRepository.findPaymentsByDriver(driverId);
  }
  async addVehicle(driverId, vehicleData) {
    if (!vehicleData || typeof vehicleData !== "object") {
      throw new Error("Invalid vehicle data");
    }
    if (!vehicleData.model || !vehicleData.plate_no) {
      throw new Error("Model and plate number are required");
    }

    // Use vehicleService to create (it validates driver role)
    const created = await vehicleService.createVehicle(driverId, vehicleData);
    return created;
  }

  // keep same function name: updateVehicle(driverId, vehicleId, vehicleData)
  async updateVehicle(driverId, vehicleId, vehicleData) {
    // ensure ownership
    const vehicle = await vehicleRepository.findById(vehicleId);
    if (!vehicle || vehicle.driver_id !== Number(driverId)) {
      throw new Error("Vehicle not found or not owned by driver");
    }

    // preserving your original constraint (only color) but allow status changes too
    const allowedFields = ["color"];
    const filteredData = {};
    for (const key of allowedFields) {
      if (vehicleData.hasOwnProperty(key)) filteredData[key] = vehicleData[key];
    }

    // If a status change is requested, route through vehicleService so it deactivates other vehicles atomically
    if (vehicleData.vehicle_status) {
      const newStatus = vehicleData.vehicle_status;
      // validate
      if (!["active", "inactive"].includes(newStatus)) {
        throw new Error("Invalid vehicle_status. Allowed: 'active' or 'inactive'");
      }
      // call service that performs transactional activation
      const updated = await vehicleService.setVehicleStatus(vehicleId, driverId, newStatus);
      // also apply other small updates (like color) if provided
      if (Object.keys(filteredData).length > 0) {
        await vehicleRepository.update(vehicleId, filteredData);
      }
      return updated;
    }

    if (Object.keys(filteredData).length === 0) {
      throw new Error("Only 'color' field can be updated (or vehicle_status to toggle active/inactive)");
    }

    return await vehicleRepository.update(vehicleId, filteredData);
  }

  // keep same function name: deleteVehicle(driverId, vehicleId)
  async deleteVehicle(driverId, vehicleId) {
    const vehicles = await vehicleRepository.getByDriverId(driverId);
    if (!vehicles || vehicles.length <= 1) {
      throw new Error("At least one vehicle must remain. Cannot delete the only vehicle.");
    }
    const vehicle = vehicles.find((v) => v.vehicle_id === Number(vehicleId));
    if (!vehicle) {
      throw new Error("Vehicle not found or not owned by driver");
    }

    return await vehicleRepository.delete(vehicleId);
  }

  // new wrapper to list vehicles for controller convenience
  async listVehicles(driverId) {
    return await vehicleService.getVehiclesForDriver(driverId);
  }

  // new wrapper to set status via driver endpoints (keeps controller name simple)
  async setVehicleStatus(driverId, vehicleId, status) {
    return await vehicleService.setVehicleStatus(vehicleId, driverId, status);
  }
  // ===== Status =====
  async updateStatus(driverId, is_live_currently) {
    if (!["yes", "no"].includes(is_live_currently)) {
      throw new Error("Invalid status. Must be 'yes' or 'no' ");
    }
    return await userRepository.update(driverId, { is_live_currently });
  }

  async withdrawMoney(user_id, amount) {
    const wallet = await walletRepository.findByUser(user_id);
    if (!wallet || wallet.balance < amount) {
      throw new Error("Insufficient wallet balance");
    }

    const txn = await walletTransactionRepository.create({
      user_id,
      amount,
      txn_type: "debit",
      status: "pending",
    });

    const result = await paymentService.withdrawMoney({ user_id, amount });

    return { txn, result };
  }
}


export default new DriverService();