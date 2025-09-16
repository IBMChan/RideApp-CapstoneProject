import ridesRepository from "../repositories/mysql/ridesRepository.js";

class AdminService {
  async getAllRides() {
    return await ridesRepository.getAll();
  }

  async getRideById(ride_id) {
    return await ridesRepository.findById(ride_id);
  }

  async updateRide(ride_id, updates) {
    return await ridesRepository.updateRide(ride_id, updates);
  }

  async deleteRide(ride_id) {
    return await ridesRepository.deleteRide(ride_id);
  }

  async getStats() {
    const rides = await ridesRepository.getAll();
    const total = rides.length;
    const completed = rides.filter(r => r.status === "completed").length;
    const cancelled = rides.filter(r => r.status === "cancelled").length;
    const ongoing = rides.filter(r => ["requested", "accepted", "in_progress"].includes(r.status)).length;

    return { total, completed, cancelled, ongoing };
  }
}

export default new AdminService();
