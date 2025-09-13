// shriya : profile managemnet, ride history, payment history, vahicle management, dr_status management(online, offline) , register a complaint  
//chandana - wallet management

import DriverRepository from "../repositories/mysql/userRepository.js";
import vehicleRepository from "../repositories/mysql/vehicleRepository.js"

class DriverService {
  // ===== Profile =====
  async getProfile(driverId) {
    const driver = await DriverRepository.findById(driverId);
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

    return await DriverRepository.update(driverId, updates);
  }

  // ===== Ride History =====
  async getRideHistory(driverId) {
    return await DriverRepository.findRidesByDriver(driverId);
  }

  // ===== Payment History =====
  async getPaymentHistory(driverId) {
    return await DriverRepository.findPaymentsByDriver(driverId);
  }

  // Vehicle Management
  async addVehicle(driverId, vehicleData) {
    console.log("Debug: vehicleData =", vehicleData);
    if (!vehicleData.model || !vehicleData.plate_no) {
        throw new Error("Model and plate number are required");
    }
    return await vehicleRepository.create(driverId, vehicleData); 
  }

  async updateVehicle(driverId, vehicleId, vehicleData) {
    const vehicle = await vehicleRepository.findById(vehicleId);
    if (!vehicle || vehicle.driver_id !== driverId) {
        throw new Error("Vehicle not found or not owned by driver");
    }
    const allowedFields = ['color'];
    const filteredData = {};
    for (const key of allowedFields) {
      if (vehicleData.hasOwnProperty(key)) {
        filteredData[key] = vehicleData[key];
      }
    }
    if (!filteredData.color) {
      throw new Error("Only 'color' field can be updated and must be provided");
    }
      return await vehicleRepository.update(vehicleId, filteredData); 
    }
  async deleteVehicle(driverId, vehicleId) {
    const vehicles = await vehicleRepository.getByDriverId(driverId); 
    if (!vehicles || vehicles.length <= 1) {
        throw new Error("At least one vehicle must remain. Cannot delete the only vehicle.");
    }
    const vehicle = vehicles.find(v => v.vehicle_id === parseInt(vehicleId));
    if (!vehicle) {
        throw new Error("Vehicle not found or not owned by driver");
    }
    return await vehicleRepository.delete(vehicleId); 
    }
  // ===== Status =====
  async updateStatus(driverId, is_live_currently) {
    if (!["yes", "no"].includes(is_live_currently)) {
      throw new Error("Invalid status. Must be 'yes' or 'no' ");
    }
    return await DriverRepository.update(driverId, { is_live_currently });
  }
}


export default new DriverService();