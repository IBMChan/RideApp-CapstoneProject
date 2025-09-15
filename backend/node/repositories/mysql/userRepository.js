// repositories/mysql/userRepository.js
// harshit and raksha : rider functionalities.
// laxmikanth : notification and registering
// shriya : profile management, driver_status management(online, offline), register a complaint  

import User from "../../entities/userModel.js";
import mysqlSequelize from "../../config/dbConfig.js";
import { QueryTypes } from "sequelize";

export const findUserById = async (userId) => {
  const [user] = await mysqlSequelize.query(
    `SELECT user_id, full_name, phone, email, role, license, kyc_type,
            kyc_document, gender, status,
            is_live_currently, created_at
     FROM users
     WHERE user_id = ?`,
    {
      replacements: [userId],
      type: QueryTypes.SELECT,
    }
  );
  return user || null;
};
import Vehicle from "../../entities/vehicleModel.js";
import Ride from "../../entities/rideModel.js";       // Sequelize
import Payment from "../../entities/paymentModel.js"; // Mongoose
import Rating from "../../entities/ratingModel.js";   // Mongoose


class UserRepository {
  async findById(id) {
    if (!id) return null;
    return await User.findByPk(id);
  }      

  async findByEmail(email) {
    if (!email) return null;
    return await User.findOne({ where: { email } });
  }

  async findByRole(role) {
    if (!role) return [];
    return await User.findAll({ where: { role } });
  }

  async createUser(data) {
    return await User.create(data);
  }

  async getDrivers() {
  return await User.findAll({
    where: { role: "driver", is_live_currently: "yes" },
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

  async updatePasswordByEmail(email, password_hash) {
  const user = await User.findOne({ where: { email } });
  if (!user) return null;
  user.password_hash = password_hash;
  await user.save();
  return user;
}

  async updateUser(id, updates) {
  const user = await this.findById(id);
  if (!user) return null;
  return await user.update(updates);
}

  async deleteUser(id) {
  const user = await this.findById(id);
  if (!user) return null;
  await user.destroy();
  return true;
}

  async isRider(id) {
  const user = await this.findById(id);
  return user && user.role === "rider";
}

  async isDriver(id) {
  const user = await this.findById(id);
  return user && user.role === "driver";
}
async update(driverId, updates) {
    const driver = await User.findByPk(driverId);
    if (!driver) throw new Error("Driver not found");

    await driver.update(updates);
    return driver;
  }
   async findRidesByDriver(driverId) {
    return Ride.findAll({
      where: { driver_id: driverId },
      // order: [["created_at", "DESC"]],
    });
  }

  // ===== Payment History (Mongo/Mongoose) =====
  async findPaymentsByDriver(driverId) {
    return Payment.find({ driver_id: driverId })
      .sort({ created_at: -1 })
      .lean();
  }

  // ===== Average Rating for driver (Mongo/Mongoose) =====
  async findRideidByDriver(driverId) {
  return Ride.findAll({
    where: { driver_id: driverId },
    attributes: ['ride_id'], // only fetch ride_id
    // order: [["created_at", "DESC"]], // Uncomment if needed
  });
  }
  // Average Rating for a Driver
 async getAverageRatingByDriver(driverId) {
  const rides = await findRideidByDriver(driverId);

  const rideIds = rides.map(ride => ride.ride_id);

  if (!rideIds.length) {
    return { averageRating: null, totalRatings: 0 };
  }

  const result = await Rating.aggregate([
    { $match: { ride_id: { $in: rideIds }, "r_to_d.rate": { $ne: null } } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$r_to_d.rate" },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  if (result.length === 0) {
    return { averageRating: null, totalRatings: 0 };
  }

  return {
    averageRating: parseFloat(result[0].averageRating.toFixed(2)),
    totalRatings: result[0].totalRatings,
  };
  }

}

export default new UserRepository();
