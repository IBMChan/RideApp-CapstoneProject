// repositories/rideDriverAssignmentRepository.js
import RideDriverAssignment from "../../entities/rideDriverAssignment.js";
import Ride from "../../entities/rideModel.js";

export default {
  async bulkCreate(assignments) {
    return RideDriverAssignment.bulkCreate(assignments);
  },

  async findByDriverId(driverId) {
    return RideDriverAssignment.findAll({
      where: { driver_id: driverId },
      include: [{ model: Ride, as: "ride" }],
    });
  },
};
