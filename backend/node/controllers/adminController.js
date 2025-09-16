// controllers/adminController.js
import adminService from "../services/adminService.js";

class adminController {
  async getAllRides(req, res) {
    const rides = await adminService.getAllRides();
    return res.json({ success: true, message: "All rides fetched", data: rides });
  }

  async getRide(req, res) {
    const { ride_id } = req.params;
    const ride = await adminService.getRideById(ride_id);
    if (!ride) return res.status(404).json({ success: false, message: "Ride not found" });
    return res.json({ success: true, message: "Ride fetched", data: ride });
  }

  async updateRide(req, res) {
    const { ride_id } = req.params;
    const updates = req.body;
    const updated = await adminService.updateRide(ride_id, updates);
    return res.json({ success: true, message: "Ride updated", data: updated });
  }

  async deleteRide(req, res) {
    const { ride_id } = req.params;
    await adminService.deleteRide(ride_id);
    return res.json({ success: true, message: "Ride deleted" });
  }

  async getStats(req, res) {
    const stats = await adminService.getStats();
    return res.json({ success: true, message: "Ride stats fetched", data: stats });
  }
}

export default new adminController();
