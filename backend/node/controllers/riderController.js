//harshit and raksha // funcitonalities: 1. ride history 2. profile management(cloud image upload) 3. saved location (managing) 4. share status(twilio to whatsapp) 5. find a lost item/contact driver or previous rides/register a complaint
//chandana - wallet management 
//error handler


// controllers/rider.controller.js
import { ValidationError } from "../utils/appError.js";
import * as riderService from "../services/riderService.js";
import { addMoneyService } from "../services/riderService.js";

// 1. Ride history
export const getRideHistory = async (req, res, next) => {
  try {
    const riderId = req.user?.id ? parseInt(req.user.id, 10) : parseInt(req.params.riderId, 10);
    console.log("Rider History called with riderId:", riderId);
    const rides = await riderService.getRideHistory(riderId);
    res.json(rides);
  } catch (err) {
    next(err);
  }
};

// 2. Profile management
export const getProfile = async (req, res, next) => {
  try {
    const riderId = req.user?.id ? parseInt(req.user.id, 10) : parseInt(req.params.riderId, 10);
    const profile = await riderService.getProfile(riderId);
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const riderId = req.user?.id ? parseInt(req.user.id, 10) : parseInt(req.params.riderId, 10);
    const updated = await riderService.updateProfile(riderId, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// 3. Saved locations
export const getSavedLocations = async (req, res, next) => {
  try {
    const riderId = req.user?.id ? parseInt(req.user.id, 10) : parseInt(req.params.riderId, 10);
    const locations = await riderService.getSavedLocations(riderId);
    res.json(locations);
  } catch (err) {
    next(err);
  }
};

export const addSavedLocation = async (req, res, next) => {
  try {
    const riderId = req.user?.id ? parseInt(req.user.id, 10) : parseInt(req.params.riderId, 10);
    if (isNaN(riderId)) {
      throw new ValidationError("Valid riderId is required.");
    }
    const location = await riderService.addSavedLocation(riderId, req.body);
    res.status(201).json(location);
  } catch (err) {
    next(err);
  }
};

export const deleteSavedLocation = async (req, res, next) => {
  try {
    const riderId = req.user?.id ? parseInt(req.user.id, 10) : parseInt(req.params.riderId, 10);
    await riderService.deleteSavedLocation(riderId, parseInt(req.params.id, 10));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// 4. Share ride status
export const shareRideStatus = async (req, res, next) => {
  try {
    const riderId = req.user?.id ? parseInt(req.user.id, 10) : parseInt(req.params.riderId, 10);
    const rideId = parseInt(req.params.rideId, 10);
    const { phoneNumber } = req.body;
    await riderService.shareRideStatus(riderId, rideId, phoneNumber);
    res.json({ message: "Ride status shared successfully" });
  } catch (err) {
    next(err);
  }
};

// 5. Complaints + Lost items
export const registerComplaint = async (req, res, next) => {
  try {
    const riderId = req.user?.id ? parseInt(req.user.id, 10) : parseInt(req.params.riderId, 10);
    const rideId = parseInt(req.params.rideId, 10);
    const complaint = await riderService.registerComplaint(riderId, rideId, req.body);
    res.status(201).json(complaint);
  } catch (err) {
    next(err);
  }
};

export const getLostItems = async (req, res, next) => {
  try {
    // const riderId = req.user?.id ? parseInt(req.user.id, 10) : parseInt(req.params.riderId, 10);
    // const rideId = parseInt(req.params.rideId, 10);
    const riderId = parseInt(req.query.riderId, 10); // ✅ from query string
    const rideId = parseInt(req.params.rideId, 10);

    if (isNaN(riderId) || isNaN(rideId)) {
      return res.status(400).json({ error: "Invalid riderId or rideId" });
    }
    const items = await riderService.getLostItems(rideId, riderId);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// --------------------- Report Lost Item ---------------------
export const reportLostItem = async (req, res, next) => {
  try {
    const { riderId, rideId } = req.params;
    const { description } = req.body;

    if (!riderId || !rideId) {
      throw new ValidationError("Valid riderId and rideId are required.");
    }

    const lostItem = await riderService.reportLostItem(
      parseInt(riderId, 10),
      parseInt(rideId, 10),
      { description }
    );

    res.status(201).json({
      success: true,
      message: "Lost item reported successfully",
      data: lostItem,
    });
  } catch (err) {
    next(err);
  }
};

// Wallet management
export const addMoney = async (req, res) => {
  try {
    const { user_id, amount, payment_method, bank_details } = req.body;
    const result = await addMoneyService({ user_id: parseInt(user_id, 10), amount, payment_method, bank_details });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
