import express from 'express';
import driverController from '../controllers/driverController.js';

const router = express.Router();



//Profile
// router.get("/profile", driverController.getProfile); //done

router.get("/profile",driverController.getProfile);

router.patch("/profile", driverController.updateProfile); //done

// Ride History
router.get("/rides",  driverController.getRideHistory); //done

// Payment History
router.get("/payments", driverController.getPaymentHistory); //done 

// Vehicles
router.post("/vehicles", driverController.addVehicle); //done 
router.put("/vehicles/:vehicleId",driverController.updateVehicle); //done
router.delete("/vehicles/:vehicleId", driverController.deleteVehicle); // done

// Status
router.put("/status",  driverController.updateStatus);//done
export default router;
