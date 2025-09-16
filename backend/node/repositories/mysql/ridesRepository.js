import Ride from "../../entities/rideModel.js";
import { Op } from "sequelize";

class RideRepository {
  // Create ride (expiry_time auto-set by model hook)
  async create({ rider_id, pickup_loc, drop_loc, distance, fare, vehicle_id = null, ride_pin = null }) {
    return await Ride.create({
      rider_id,
      pickup_loc,
      drop_loc,
      distance,
      fare,
      vehicle_id,
      status: "requested",
      ride_pin
    });
  }

  async findById(ride_id) {
    return await Ride.findByPk(ride_id);
  }

  async updateStatus(ride_id, status, pin = null) {
    const ride = await this.findById(ride_id);
    if (!ride) return null;

    if (status === "in_progress") {
      if (!pin || pin !== ride.ride_pin) {
        return null;
      }
    }

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
    const rides = await Ride.findAll({
      where: { status: "requested" },
      attributes: { exclude: ["ride_pin"] },
      raw: true, // returns plain objects instead of Sequelize instances
    });

    return rides.map((ride) => ({
      ...ride,
      pickup_loc: ride.pickup_loc ? JSON.parse(ride.pickup_loc) : null,
      drop_loc: ride.drop_loc ? JSON.parse(ride.drop_loc) : null,
    }));
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

  async clearSensitiveFields(ride_id) {
    const ride = await this.findById(ride_id);
    if (!ride) return null;
    return await ride.update({ driver_id: null, vehicle_id: null, ride_pin: null });
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
