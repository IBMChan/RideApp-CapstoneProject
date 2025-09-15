// services/vehicleService.js
import vehicleRepository from "../repositories/mysql/vehicleRepository.js";
import userRepository from "../repositories/mysql/userRepository.js";
import AppError from "../utils/appError.js";
import sequelize from "../config/sqlConfig.js";

class VehicleService {
  async createVehicle(driverId, data) {
    if (!driverId) throw new AppError("Driver ID required", 400, "MISSING_DRIVER_ID");
    const isDriver = await userRepository.isDriver(driverId);
    if (!isDriver) throw new AppError("Only drivers can create vehicles", 403, "NOT_A_DRIVER");

    // Basic validation can be done here (plate_no etc.)
    const vehicle = await vehicleRepository.create(driverId, data);
    return vehicle;
  }

  async updateVehicle(vehicleId, driverId, updates) {
    if (!vehicleId) throw new AppError("Vehicle ID required", 400, "MISSING_VEHICLE_ID");
    if (!driverId) throw new AppError("Driver ID required", 400, "MISSING_DRIVER_ID");

    const vehicle = await vehicleRepository.findById(vehicleId);
    if (!vehicle) throw new AppError("Vehicle not found", 404, "VEHICLE_NOT_FOUND");

    if (vehicle.driver_id !== Number(driverId)) {
      throw new AppError("Not authorized to update this vehicle", 403, "NOT_OWNER");
    }

    // If they are making this vehicle active, we must deactivate others atomically
    if (updates.vehicle_status === "active") {
      const t = await sequelize.transaction();
      try {
        // deactivate other vehicles for this driver
        await vehicleRepository.deactivateAllExcept(driverId, vehicleId, { transaction: t });
        // update this vehicle
        const updated = await vehicleRepository.update(vehicleId, updates, { transaction: t });
        await t.commit();
        return updated;
      } catch (err) {
        await t.rollback();
        throw new AppError(err.message || "Failed to set active vehicle", 500, "VEHICLE_UPDATE_FAILED");
      }
    }

    // If only setting inactive or other fields, simple update
    return await vehicleRepository.update(vehicleId, updates);
  }

  // explicit API to set status (active/inactive)
  async setVehicleStatus(vehicleId, driverId, status) {
    if (!["active", "inactive"].includes(status)) {
      throw new AppError("Invalid status", 422, "INVALID_STATUS");
    }
    return this.updateVehicle(vehicleId, driverId, { vehicle_status: status });
  }

  async getVehiclesForDriver(driverId) {
    if (!driverId) throw new AppError("Driver ID required", 400, "MISSING_DRIVER_ID");
    return vehicleRepository.getByDriverId(driverId);
  }

  async getVehicleById(vehicleId) {
    const v = await vehicleRepository.findById(vehicleId);
    if (!v) throw new AppError("Vehicle not found", 404, "VEHICLE_NOT_FOUND");
    return v;
  }

  async deleteVehicle(vehicleId, driverId) {
    const v = await vehicleRepository.findById(vehicleId);
    if (!v) throw new AppError("Vehicle not found", 404, "VEHICLE_NOT_FOUND");
    if (v.driver_id !== Number(driverId)) throw new AppError("Not authorized", 403, "NOT_OWNER");
    return vehicleRepository.delete(vehicleId);
  }
}

export default new VehicleService();
