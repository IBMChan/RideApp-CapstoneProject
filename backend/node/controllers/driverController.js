// shriya : profile managemnet, ride history, payment history, vehicle management, dr_status management(online, offline) , register a complaint  
//chandana - wallet management
// backend/node/controllers/driverController.js

// controllers/driverController.js
import DriverService from "../services/driverService.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

class DriverController {
  // ========== Profile ==========
  async getProfile(req, res, next) {
    try {
      const driverId = req.user?.user_id;
      const profile = await DriverService.getProfile(driverId);
      return res.json({ success: true, data: profile });
    } catch (err) {
      return next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const driverId = req.user?.user_id;
      const fieldsToUpdate = req.body;
      const updatedProfile = await DriverService.updateProfile(driverId, fieldsToUpdate);
      return res.json({ success: true, data: updatedProfile });
    } catch (err) {
      return next(err);
    }
  }

  // ========== Ride History ==========
  async getRideHistory(req, res, next) {
    try {
      const driverId = req.user?.user_id;
      const rides = await DriverService.getRideHistory(driverId);
      return res.json({ success: true, data: rides });
    } catch (err) {
      return next(err);
    }
  }

  // ========== Payment History ==========
  async getPaymentHistory(req, res, next) {
    try {
      const driverId = req.user?.user_id;
      const payments = await DriverService.getPaymentHistory(driverId);
      return res.json({ success: true, data: payments });
    } catch (err) {
      return next(err);
    }
  }

  // ========== Vehicle Management ==========
  async addVehicle(req, res, next) {
    try {
      const driverId = req.user?.user_id;
      const vehicle = await DriverService.addVehicle(driverId, req.body);
      return res.status(201).json({ success: true, data: vehicle });
    } catch (err) {
      return next(err);
    }
  }

  async updateVehicle(req, res, next) {
    try {
      const { vehicleId } = req.params;
      const driverId = req.user?.user_id;
      const vehicle = await DriverService.updateVehicle(driverId, vehicleId, req.body);
      return res.json({ success: true, data: vehicle });
    } catch (err) {
      return next(err);
    }
  }

  async deleteVehicle(req, res, next) {
    try {
      const { vehicleId } = req.params;
      const driverId = req.user?.user_id;
      await DriverService.deleteVehicle(driverId, vehicleId);
      return res.json({ success: true, message: "Vehicle deleted successfully" });
    } catch (err) {
      return next(err);
    }
  }

  // NEW: List vehicles for driver
  async listVehicles(req, res, next) {
    try {
      const driverId = req.user?.user_id;
      const vehicles = await DriverService.listVehicles(driverId);
      return res.json({ success: true, data: vehicles });
    } catch (err) {
      return next(err);
    }
  }

  // NEW: Set vehicle status (active/inactive)
  async setVehicleStatus(req, res, next) {
    try {
      const driverId = req.user?.user_id;
      const { vehicleId } = req.params;
      const { vehicle_status } = req.body;
      const updated = await DriverService.setVehicleStatus(driverId, vehicleId, vehicle_status);
      return res.json({ success: true, data: updated });
    } catch (err) {
      return next(err);
    }
  }

  // ========== Status ==========
  async updateStatus(req, res, next) {
    try {
      const driverId = req.user?.user_id;
      const { is_live_currently } = req.body; // "yes" or "no"
      const updatedDriver = await DriverService.updateStatus(driverId, is_live_currently);
      return res.json({ success: true, data: updatedDriver });
    } catch (err) {
      return next(err);
    }
  }

  // ========== Driver Average Rating ==========
  async getAverageRating(req, res, next) {
    try {
      const driverId = req.user?.user_id;
      const ratingStats = await DriverService.getAverageRating(driverId);
      return res.json({ success: true, data: ratingStats });
    } catch (err) {
      return next(err);
    }
  }

  // ========== Payment Confirmation ==========
  async confirmPayment(req, res, next) {
    try {
      const { payment_id } = req.params;
      const driverId = req.user?.user_id;
      const confirmation = await DriverService.confirmPayment(driverId, payment_id);
      return res.json({ success: true, data: confirmation });
    } catch (err) {
      return next(err);
    }
  }

  // ========== Withdraw Money ==========
  async withdrawMoney(req, res, next) {
    try {
      const { driver_id } = req.params;
      const { amount } = req.body;
      const result = await DriverService.withdrawMoney(driver_id, amount);
      return res.json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
}

export default new DriverController();


// import {withdrawMoney } from "../services/driverService.js";
// import DriverService from "../services/driverService.js";
// import { successResponse, errorResponse } from "../utils/apiResponse.js";


// class DriverController {
//   // ========== Profile ==========
//   async getProfile(req, res, next) {
//     try {
//       const driverId = req.user?.user_id;
//       // const driverId=1;
//       const profile = await DriverService.getProfile(driverId);
//       res.json(profile);
//     } catch (err) {
//       next(err);
//     }
//   }

//   async updateProfile(req, res, next) {
//     try {
//       const driverId = req.user?.user_id;
//       // const driverId=1;
//       const fieldsToUpdate = req.body;
//       const updatedProfile = await DriverService.updateProfile(driverId, fieldsToUpdate);
//       res.json(updatedProfile);
//     } catch (err) {
//       next(err);
//     }
//   }

//   // ========== Ride History ==========
//   async getRideHistory(req, res, next) {
//     try {
//       const driverId = req.user?.user_id;
//       // const driverId=1;
//       const rides = await DriverService.getRideHistory(driverId);
//       res.json(rides);
//     } catch (err) {
//       next(err);
//     }
//   }

//   // ========== Payment History ==========
//   async getPaymentHistory(req, res, next) {
//     try {
//       const driverId = req.user?.user_id;
//       // const driverId=1;
//       const payments = await DriverService.getPaymentHistory(driverId);
//       res.json(payments);
//     } catch (err) {
//       next(err);
//     }
//   }

//   // ========== Vehicle Management ==========
//   async addVehicle(req, res, next) {
//     try {
//       const driverId = req.user?.user_id;
//       // const driverId=1;
//       const vehicle = await DriverService.addVehicle(driverId, req.body);
//       res.status(201).json(vehicle);
//     } catch (err) {
//       next(err);
//     }
//   }

//   async updateVehicle(req, res, next) {
//     try {
//       const { vehicleId } = req.params;
//       console.log("vehicle id=  ",vehicleId);
//       const driverId = req.user?.user_id;
//       // const driverId=1;
//       const vehicle = await DriverService.updateVehicle(driverId, vehicleId, req.body);
//       res.json(vehicle);
//     } catch (err) {
//       next(err);
//     }
//   }

//   async deleteVehicle(req, res, next) {
//     try {
//       const { vehicleId } = req.params;
//       const driverId = req.user?.user_id;
//       // const driverId=1;
//       await DriverService.deleteVehicle(driverId, vehicleId);
//       res.json({ message: "Vehicle deleted successfully" });
//     } catch (err) {
//       next(err);
//     }
//   }

//   // ========== Status ==========
//   async updateStatus(req, res, next) {
//     try {
//       const driverId = req.user?.user_id;
//       // const driverId=1;
//       const { is_live_currently } = req.body; // "yes" or "no"
//       const updatedDriver = await DriverService.updateStatus(driverId, is_live_currently);
//       res.json(updatedDriver);
//     } catch (err) {
//       next(err);
//     }
//   }
//   // ========== Driver Average Rating ==========
// async getAverageRating(req, res, next) {
//   try {
//     const driverId = req.user?.user_id;
//     const ratingStats = await DriverService.getAverageRating(driverId);
//     res.json(ratingStats);
//   } catch (err) {
//     next(err);
//   }
// }


//   // inside class DriverController

//   // ========== Payment Confirmation ==========
//   async confirmPayment(req, res, next) {
//     try {
//       const { payment_id } = req.params;
//       const driverId = req.user?.user_id;// when auth is ready

//       const confirmation = await DriverService.confirmPayment(driverId, payment_id);
//       res.json({ message: "Payment confirmed successfully", confirmation });
//     } catch (err) {
//       next(err);
//     }
//   }

//     async withdrawMoney(req, res) {
//     try {
//       const { driver_id } = req.params;
//       const { amount } = req.body;
//       const result = await driverService.withdrawMoney(driver_id, amount);
//       return successResponse(res, "Withdrawal initiated", result);
//     } catch (err) {
//       return errorResponse(res, err, err.statusCode || 400);
//     }
//   }

// }

// export default new DriverController();


