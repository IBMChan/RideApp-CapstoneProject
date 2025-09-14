//shriya:  vehicle management
//laxmi: vehilce registration(first time)

import Vehicle from '../../entities/vehicleModel.js'; // Adjust path to your model

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

  async update(vehicleId, updates) {
    const vehicle = await this.findById(vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    await vehicle.update(updates);
    return vehicle;
  }

  async delete(vehicleId) {
    const vehicle = await this.findById(vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    await vehicle.destroy();
    return { message: "Vehicle deleted successfully" };
  }
}

export default new VehicleRepository();
