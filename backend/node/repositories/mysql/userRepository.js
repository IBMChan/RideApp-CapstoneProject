//harshit and raksha : rider functionalities.
//laxmikanth : notfication and registering
// shriya : profile managemnetdr_status management(online, offline) , register a complaint  
import User from "../../entities/userModel.js";
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
}

export default new UserRepository();
