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
import Ride from "../../entities/rideModel.js";     

class UserRepository {
  async findById(id) {
    if (!id) return null;
    return await User.findByPk(id);
  }      

  async findByEmail(email) {
    if (!email) return null;
    return await User.findOne({ where: { email } });
  }

  async findByPhone(phone) {                                     
  if (!phone) return null;
  return await User.findOne({ where: { phone } });
}

// Add this method to UserRepository class in userRepository.js
async findByKycDocument(kyc_document) {
  if (!kyc_document) return null;
  return await User.findOne({ where: { kyc_document } });
}



  async findByRole(role) {
    if (!role) return [];
    return await User.findAll({ where: { role } });
  }

  async createUser(data) {
    return await User.create(data);
  }

 // Updated createUser method in userRepository.js
async createUser(data) {
  try {
    return await User.create(data);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      // Check which field caused the uniqueness error
      if (error.fields && error.fields.includes('email')) {
        throw new Error('Email already in use');
      }
      if (error.fields && error.fields.includes('phone')) {
        throw new Error('Phone number already in use');
      }
      if (error.fields && error.fields.includes('kyc_document')) {
        throw new Error('ID number already in use');
      }
      throw new Error('User with these details already exists');
    }
    throw error;
  }
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
}

export default new UserRepository();
