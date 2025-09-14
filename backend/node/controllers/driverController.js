// shriya : profile managemnet, ride history, payment history, vehicle management, dr_status management(online, offline) , register a complaint  
//chandana - wallet management
// backend/node/controllers/driverController.js
// import {withdrawMoney } from "../services/driverService.js";
import DriverService from "../services/driverService.js";


// export const withdrawMoneyFromWallet = async (req, res, next) => {
//   try {
//     const userId = req.user.user_id; // Assume auth middleware populates req.user
//     const { amount, accountDetails } = req.body;

//     if (!amount || amount <= 0) {
//       return res.status(400).json({ error: "Invalid amount" });
//     }

//     if (!accountDetails) {
//       return res.status(400).json({ error: "Account details required" });
//     }

//     const result = await withdrawMoney(userId, amount, accountDetails);
//     res.status(200).json(result);
//   } catch (err) {
//     next(err);
//   }
// };

class DriverController {
  // ========== Profile ==========
  async getProfile(req, res, next) {
    try {
      const driverId = req.user?.user_id;
      // const driverId=1;
      const profile = await DriverService.getProfile(driverId);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const driverId = req.user?.user_id;
      // const driverId=1;
      const fieldsToUpdate = req.body;
      const updatedProfile = await DriverService.updateProfile(driverId, fieldsToUpdate);
      res.json(updatedProfile);
    } catch (err) {
      next(err);
    }
  }

  // ========== Ride History ==========
  async getRideHistory(req, res, next) {
    try {
      const driverId = req.user?.user_id;
      // const driverId=1;
      const rides = await DriverService.getRideHistory(driverId);
      res.json(rides);
    } catch (err) {
      next(err);
    }
  }

  // ========== Payment History ==========
  async getPaymentHistory(req, res, next) {
    try {
      const driverId = req.user?.user_id;
      // const driverId=1;
      const payments = await DriverService.getPaymentHistory(driverId);
      res.json(payments);
    } catch (err) {
      next(err);
    }
  }

  // ========== Vehicle Management ==========
  async addVehicle(req, res, next) {
    try {
      const driverId = req.user?.user_id;
      // const driverId=1;
      const vehicle = await DriverService.addVehicle(driverId, req.body);
      res.status(201).json(vehicle);
    } catch (err) {
      next(err);
    }
  }

  async updateVehicle(req, res, next) {
    try {
      const { vehicleId } = req.params;
      console.log("vehicle id=  ",vehicleId);
      const driverId = req.user?.user_id;
      // const driverId=1;
      const vehicle = await DriverService.updateVehicle(driverId, vehicleId, req.body);
      res.json(vehicle);
    } catch (err) {
      next(err);
    }
  }

  async deleteVehicle(req, res, next) {
    try {
      const { vehicleId } = req.params;
      const driverId = req.user?.user_id;
      // const driverId=1;
      await DriverService.deleteVehicle(driverId, vehicleId);
      res.json({ message: "Vehicle deleted successfully" });
    } catch (err) {
      next(err);
    }
  }

  // ========== Status ==========
  async updateStatus(req, res, next) {
    try {
      const driverId = req.user?.user_id;
      // const driverId=1;
      const { is_live_currently } = req.body; // "yes" or "no"
      const updatedDriver = await DriverService.updateStatus(driverId, is_live_currently);
      res.json(updatedDriver);
    } catch (err) {
      next(err);
    }
  }
  // ========== Driver Average Rating ==========
async getAverageRating(req, res, next) {
  try {
    const driverId = req.user?.user_id;
    const ratingStats = await DriverService.getAverageRating(driverId);
    res.json(ratingStats);
  } catch (err) {
    next(err);
  }
}


  // inside class DriverController

  // ========== Payment Confirmation ==========
  async confirmPayment(req, res, next) {
    try {
      const { payment_id } = req.params;
      const driverId = req.user?.user_id;// when auth is ready

      const confirmation = await DriverService.confirmPayment(driverId, payment_id);
      res.json({ message: "Payment confirmed successfully", confirmation });
    } catch (err) {
      next(err);
    }
  }

}

export default new DriverController();


