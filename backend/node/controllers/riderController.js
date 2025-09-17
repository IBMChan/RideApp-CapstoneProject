// harshit and raksha - functionalities: 1. ride history 2. profile management(cloud image upload) 3. saved location (managing) 4. share status(twilio to whatsapp) 5. find a lost item/contact driver or previous rides/register a complaint
// chandana - wallet management 
//error handler

import { ValidationError } from "../utils/appError.js";
import riderService from "../services/riderService.js";

// --------------------- 1. Ride history ---------------------
export const getRideHistory = async (req, res, next) => {
  try {
    const riderId = req.user?.user_id
      ? parseInt(req.user.user_id, 10)
      : parseInt(req.params.riderId, 10);
    console.log("Rider History called with riderId:", riderId);
    const rides = await riderService.getRideHistory(riderId);
    res.json(rides);
  } catch (err) {
    next(err);
  }
};

// --------------------- 2. Profile management ---------------------
export const getProfile = async (req, res, next) => {
  try {
    const riderId = req.user?.user_id
      ? parseInt(req.user.user_id, 10)
      : parseInt(req.params.riderId, 10);
    const profile = await riderService.getProfile(riderId);
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const riderId = req.user?.user_id
      ? parseInt(req.user.user_id, 10)
      : parseInt(req.params.riderId, 10);
    const updated = await riderService.updateProfile(riderId, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// --------------------- 3. Saved locations ---------------------
export const getSavedLocations = async (req, res, next) => {
  try {
    const riderId = req.user?.user_id
      ? parseInt(req.user.user_id, 10)
      : parseInt(req.params.riderId, 10);
    const locations = await riderService.getSavedLocations(riderId);
    res.json(locations);
  } catch (err) {
    next(err);
  }
};

export const addSavedLocation = async (req, res, next) => {
  try {
    const riderId = req.user?.user_id
      ? parseInt(req.user.user_id, 10)
      : parseInt(req.params.riderId, 10);

      console.log();
      
    if (isNaN(riderId)) {
      throw new ValidationError("Valid riderId is required.");
    }

    const { label, address, latitude, longitude } = req.body;

    if (!label || !address || !latitude || !longitude) {
      throw new ValidationError("All fields (label, address, latitude, longitude) are required.");
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      throw new ValidationError("Latitude and Longitude must be valid numbers.");
    }

    const location = await riderService.addSavedLocation(riderId, {
      label,
      address,
      latitude: lat,
      longitude: lng,
    });

    res.status(201).json(location);
  } catch (err) {
    next(err);
  }
};


export const deleteSavedLocation = async (req, res, next) => {
  try {
    const riderId = req.user?.user_id
      ? parseInt(req.user.user_id, 10)
      : parseInt(req.params.riderId, 10);
    await riderService.deleteSavedLocation(
      riderId,
      parseInt(req.params.id, 10)
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// --------------------- 4. Share ride status ---------------------
// --------------------- Share Ride Status via Email ---------------------
export const shareRideStatusEmail = async (req, res, next) => {
  try {
    console.log("[DEBUG] req.params.rideId:", req.params.rideId);
    console.log("[DEBUG] req.body:", req.body);
    const riderId = parseInt(req.body.riderId, 10);
    const rideId = parseInt(req.params.rideId, 10);
    const { recipientEmail } = req.body;

    if (isNaN(riderId) || isNaN(rideId)) {
      return res.status(400).json({ error: "Valid riderId and rideId are required." });
    }

    const result = await riderService.shareRideStatus(riderId, rideId, recipientEmail);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// --------------------- SOS ---------------------
export const sendSOS = async (req, res, next) => {
  try {
    const riderId = parseInt(req.params.riderId, 10);
    const { recipientEmail, customMessage } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ error: "Recipient email is required." });
    }

    const result = await riderService.sendSOS(riderId, recipientEmail, customMessage);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


// --------------------- 5. Complaints + Lost items ---------------------
export const registerComplaint = async (req, res, next) => {
  try {
    const riderId = parseInt(req.body.riderId, 10);
    const rideId = parseInt(req.params.rideId, 10);
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

export const getComplaints = async (req, res, next) => {
  try {
    const riderId = parseInt(req.query.riderId, 10);
    if (isNaN(riderId)) {
      return res.status(400).json({ error: "Valid riderId is required." });
    }
    const complaints = await riderService.getComplaints(riderId);
    res.json({ success: true, data: complaints });
  } catch (err) {
    next(err);
  }
};

export const getLostItems = async (req, res, next) => {
  try {
    const riderId = parseInt(req.query.riderId, 10);
    const rideId = parseInt(req.params.rideId, 10);

    console.log(`${riderId} ${rideId}`);
    

    if (isNaN(riderId) || isNaN(rideId)) {
      return res.status(400).json({ error: "Invalid riderId or rideId" });
    }
    const items = await riderService.getLostItems(rideId, riderId);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

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