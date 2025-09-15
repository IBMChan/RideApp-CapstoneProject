// repositories/mysql/vehicleRepository.js
import Vehicle from "../../entities/vehicleModel.js";
import { Op } from "sequelize";
import sequelize from "../../config/sqlConfig.js";

class VehicleRepository {
  async getByDriverId(driverId) {
    return Vehicle.findAll({ where: { driver_id: driverId } });
  }

  async findById(vehicleId) {
    return Vehicle.findByPk(vehicleId);
  }

  async create(driverId, data) {
    return Vehicle.create({ driver_id: driverId, ...data });
  }

  // options may contain { transaction }
  async update(vehicleId, updates, options = {}) {
    const vehicle = await this.findById(vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");
    return vehicle.update(updates, options);
  }

  async delete(vehicleId) {
    const vehicle = await this.findById(vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");
    await vehicle.destroy();
    return { message: "Vehicle deleted successfully" };
  }

  // Sets vehicle_status = 'inactive' for all driver's vehicles except vehicleIdToKeep
  async deactivateAllExcept(driverId, vehicleIdToKeep = null, options = {}) {
    const where = { driver_id: driverId };
    if (vehicleIdToKeep) where.vehicle_id = { [Op.ne]: vehicleIdToKeep };
    return Vehicle.update({ vehicle_status: "inactive" }, { where, ...options });
  }

  async getActiveByDriver(driverId) {
    return Vehicle.findOne({ where: { driver_id: driverId, vehicle_status: "active" } });
  }
}

export default new VehicleRepository();
