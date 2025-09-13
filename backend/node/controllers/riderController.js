//harshit and raksha // funcitonalities: 1. ride history 2. profile management(cloud image upload) 3. saved location (managing) 4. share status(twilio to whatsapp) 5. find a lost item/contact driver or previous rides/register a complaint
//chandana - wallet management 
//error handler

// controllers/rider.controller.js
import * as riderService from "../services/riderService.js";

// 1. Ride history
export const getRideHistory = async (req, res, next) => {
  try {
    const riderId = req.user?.id || req.params.riderId; // auth or param
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
    const riderId = req.user?.id || req.params.riderId;
    const profile = await riderService.getProfile(riderId);
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const riderId = req.user?.id || req.params.riderId;
    const updated = await riderService.updateProfile(riderId, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// 3. Saved locations
export const getSavedLocations = async (req, res, next) => {
  try {
    const riderId = req.user?.id || req.params.riderId;
    const locations = await riderService.getSavedLocations(riderId);
    res.json(locations);
  } catch (err) {
    next(err);
  }
};

export const addSavedLocation = async (req, res, next) => {
  try {
    const riderId = req.user?.id || req.params.riderId;
    const location = await riderService.addSavedLocation(riderId, req.body);
    res.status(201).json(location);
  } catch (err) {
    next(err);
  }
};

export const deleteSavedLocation = async (req, res, next) => {
  try {
    const riderId = req.user?.id || req.params.riderId;
    await riderService.deleteSavedLocation(riderId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// 4. Share ride status
export const shareRideStatus = async (req, res, next) => {
  try {
    const riderId = req.user?.id || req.params.riderId;
    const { rideId } = req.params;
    const { phoneNumber } = req.body; // recipient of SMS/WhatsApp
    await riderService.shareRideStatus(riderId, rideId, phoneNumber);
    res.json({ message: "Ride status shared successfully" });
  } catch (err) {
    next(err);
  }
};

// 5. Complaints + Lost items
export const registerComplaint = async (req, res, next) => {
  try {
    const riderId = req.user?.id || req.params.riderId;
    const { rideId } = req.params;
    const complaint = await riderService.registerComplaint(
      riderId,
      rideId,
      req.body
    );
    res.status(201).json(complaint);
  } catch (err) {
    next(err);
  }
};

export const getLostItems = async (req, res, next) => {
  try {
    const riderId = req.user?.id || req.params.riderId;
    const { rideId } = req.params;
    const items = await riderService.getLostItems(riderId, rideId);
    res.json(items);
  } catch (err) {
    next(err);
  }
};
