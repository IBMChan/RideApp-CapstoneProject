// Raksha & Harshit 

import { ValidationError } from "../utils/appError.js";
import rateService from "../services/ratingService.js";


// --------------------- 7. Ratings (Rider → Driver) ---------------------
export const rateDriver = async (req, res, next) => {
  try {
    const rideId = parseInt(req.params.rideId, 10);
    const riderId = parseInt(req.body.riderId, 10);
    const driverId = parseInt(req.body.driverId, 10);

    if (isNaN(riderId) || isNaN(driverId) || isNaN(rideId)) {
      throw new ValidationError("Valid riderId, driverId and rideId are required.");
    }

    const { rate, comment } = req.body;
    const rating = await rateService.rateDriver(riderId, rideId, driverId, rate, comment);

    res.status(201).json({
      success: true,
      message: "Rating submitted successfully",
      data: rating,
    });
  } catch (err) {
    next(err);
  }
};

export const getDriverRating = async (req, res, next) => {
  try {
    const rideId = parseInt(req.params.rideId, 10);
    const riderId = parseInt(req.query.riderId, 10);
    console.log(`${rideId} ${riderId}`);
    
    if (isNaN(riderId) || isNaN(rideId)) {
      throw new ValidationError("Valid riderId and rideId are required.");
    }
    const rating = await rateService.getDriverRating(rideId, riderId);
    res.json({ success: true, data: rating });
  } catch (err) {
    next(err);
  }
};

export const updateDriverRating = async (req, res, next) => {
  try {
    const rideId = parseInt(req.params.rideId, 10);
    const riderId = parseInt(req.body.riderId, 10);
    if (isNaN(riderId) || isNaN(rideId)) {
      throw new ValidationError("Valid riderId and rideId are required.");
    }
    const { rate, comment } = req.body;
    const rating = await rateService.updateDriverRating(riderId, rideId, { rate, comment });
    res.json({ success: true, message: "Rating updated successfully", data: rating });
  } catch (err) {
    next(err);
  }
};

export const deleteDriverRating = async (req, res, next) => {
  try {
    const rideId = parseInt(req.params.rideId, 10);
    const riderId = parseInt(req.body.riderId, 10);
    if (isNaN(riderId) || isNaN(rideId)) {
      throw new ValidationError("Valid riderId and rideId are required.");
    }
    await rateService.deleteDriverRating(rideId, riderId);
    res.json({ success: true, message: "Rating deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// --------------------- 8. Ratings (Driver → Rider) ---------------------
export const rateRider = async (req, res, next) => {
  try {
    const rideId = parseInt(req.params.rideId, 10);
    const driverId = parseInt(req.body.driverId, 10);
    const riderId = parseInt(req.body.riderId, 10);

    if (isNaN(driverId) || isNaN(riderId) || isNaN(rideId)) {
      throw new ValidationError("Valid driverId, riderId and rideId are required.");
    }

    const { rate, comment } = req.body;
    const rating = await rateService.rateRider(driverId, rideId, riderId, rate, comment);

    res.status(201).json({
      success: true,
      message: "Rating submitted successfully",
      data: rating,
    });
  } catch (err) {
    next(err);
  }
};

export const getRiderRating = async (req, res, next) => {
  try {
    const rideId = parseInt(req.params.rideId, 10);
    const driverId = parseInt(req.query.driverId, 10);
    console.log(`${rideId} ${driverId}`);
    if (isNaN(driverId) || isNaN(rideId)) {
      throw new ValidationError("Valid driverId and rideId are required.");
    }
    const rating = await rateService.getRiderRating(rideId, driverId);
    res.json({ success: true, data: rating });
  } catch (err) {
    next(err);
  }
};

export const updateRiderRating = async (req, res, next) => {
  try {
    const rideId = parseInt(req.params.rideId, 10);
    const driverId = parseInt(req.body.driverId, 10);
    if (isNaN(driverId) || isNaN(rideId)) {
      throw new ValidationError("Valid driverId and rideId are required.");
    }
    const { rate, comment } = req.body;
    const rating = await rateService.updateRiderRating(driverId, rideId, { rate, comment });
    res.json({ success: true, message: "Rating updated successfully", data: rating });
  } catch (err) {
    next(err);
  }
};

export const deleteRiderRating = async (req, res, next) => {
  try {
    const rideId = parseInt(req.params.rideId, 10);
    const driverId = parseInt(req.body.driverId, 10);
    if (isNaN(driverId) || isNaN(rideId)) {
      throw new ValidationError("Valid driverId and rideId are required.");
    }
    await rateService.deleteRiderRating(rideId, driverId);
    res.json({ success: true, message: "Rating deleted successfully" });
  } catch (err) {
    next(err);
  }
};
