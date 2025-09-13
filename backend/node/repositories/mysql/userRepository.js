//harshit and raksha : rider functionalities.
//laxmikanth : notfication and registering
// shriya : profile managemnetdr_status management(online, offline) , register a complaint  
import User from "../../entities/userModel.js";
import Ride from "../../entities/rideModel.js";       // Sequelize
import Payment from "../../entities/paymentModel.js"; // Mongoose
import Rating from "../../entities/ratingModel.js";   // Mongoose


export const findByEmail = async (email) => {
  if (!email) return null;
  return await User.findOne({ where: { email } });
};

export const createUser = async (data) => {
  return await User.create(data);
};

export const updatePasswordByEmail = async (email, password_hash) => {
  const user = await User.findOne({ where: { email } });
  if (!user) return null;
  user.password_hash = password_hash;
  await user.save();
  return user;
};

class DriverRepository {
  // ===== Profile (Sequelize) =====
  async findById(driverId) {
    return User.findByPk(driverId);
  }

  async update(driverId, updates) {
    const driver = await User.findByPk(driverId);
    if (!driver) throw new Error("Driver not found");

    await driver.update(updates);
    return driver;
  }

  // ===== Ride History (Sequelize) =====
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

  // ===== Ratings (Mongo/Mongoose) =====
  async findRatingsByDriver(driverId) {
    return Rating.find({ driver_id: driverId })
      .sort({ created_at: -1 })
      .lean();
  }
}

export default new DriverRepository();