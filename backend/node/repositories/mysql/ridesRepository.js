import Ride from "../../entities/rideModel.js";
import { Op } from "sequelize";

class RideRepository {
  // Create ride (expiry_time auto-set by model hook)
  async create({ rider_id, pickup_loc, drop_loc, distance, fare, vehicle_id = null }) {
    return await Ride.create({
      rider_id,
      pickup_loc,
      drop_loc,
      distance,
      fare,
      vehicle_id,
      status: "requested",
    });
  }

  async findById(ride_id) {
    return await Ride.findByPk(ride_id);
  }

  async updateStatus(ride_id, status) {
    const ride = await this.findById(ride_id);
    if (!ride) return null;
    return await ride.update({ status });
  }

  async assignDriver(ride_id, driver_id, vehicle_id = null) {
    const ride = await this.findById(ride_id);
    if (!ride) return null;
    return await ride.update({ driver_id, vehicle_id, status: "accepted" });
  }

  async completeRide(ride_id) {
    const ride = await this.findById(ride_id);
    if (!ride) return null;
    return await ride.update({ status: "completed" });
  }

  async cancelRide(ride_id) {
    const ride = await this.findById(ride_id);
    if (!ride) return null;
    return await ride.update({ status: "cancelled" });
  }

  // Rider-specific
  async findOngoingByRider(rider_id) {
    return await Ride.findOne({
      where: {
        rider_id,
        status: { [Op.in]: ["requested", "accepted", "in_progress"] },
      },
    });
  }

  // Driver-specific
  async findOngoingByDriver(driver_id) {
    return await Ride.findOne({
      where: {
        driver_id,
        status: { [Op.in]: ["accepted", "in_progress"] },
      },
    });
  }

  async getPendingRides() {
    return await Ride.findAll({ where: { status: "requested" } });
  }

  async getOngoingRidesByDriver(driver_id) {
    return await Ride.findAll({
      where: { driver_id, status: { [Op.in]: ["accepted", "in_progress"] }, },
      order: [["ride_date", "DESC"]],
    });
  }

  async getRideHistoryByDriver(driver_id) {
    return await Ride.findAll({
      where: { driver_id, status: { [Op.in]: ["completed", "cancelled", "expired"] } },
      order: [["ride_date", "DESC"]],
    });
  }
  
  async getRideById(ride_id) {
    return await Ride.findByPk(ride_id);
  }

  async getRidesByRider(rider_id) {
    return await Ride.findAll({
      where: { rider_id },
      order: [["ride_date", "DESC"]],
    });
  }

  async updateRide(ride_id, updates) {
    return await Ride.update(updates, { where: { ride_id } });
  }

  async deleteRide(ride_id) {
    return await Ride.destroy({ where: { ride_id } });
  }

  async getRidesByDriver(driver_id) {
    return await Ride.findAll({
      where: { driver_id },
      order: [["ride_date", "DESC"]],
    });
  }

  async findByRider(rider_id) {
    return this.getRidesByRider(rider_id);
  }

  async findByDriver(driver_id) {
    return this.getRidesByDriver(driver_id);
  }

  async getAll() {
    return await Ride.findAll({ order: [["ride_date", "DESC"]] });
  }

  // ✅ NEW FUNCTION: get the most recent ride for a rider
  async getLatestRideByRider(rider_id) {
    return await Ride.findOne({
      where: { rider_id },
      order: [["ride_date", "DESC"]],
    });
  }
}

export default new RideRepository();
