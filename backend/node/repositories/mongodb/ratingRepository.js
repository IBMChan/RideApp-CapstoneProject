// repositories/mongodb/ratingRepository.js
// Chandana - update/delete rating
// Shriya - fetch ratings/averages
// Raksha & Harshit - Rider → Driver ratings

import Rating from "../../entities/ratingModel.js";

// ---------------- Rider → Driver (r_to_d) ----------------

// 1. Create/Add Rating
export const addRiderToDriverRating = async (rideId, riderId, driverId, rate, comment) => {
  let rating = await Rating.findOne({ ride_id: rideId, rider_id: riderId });

  if (rating) {
    // If rating exists → update r_to_d
    rating.r_to_d = { rate, comment };
    return await rating.save();
  }

  // Create new rating
  rating = new Rating({
    ride_id: rideId,
    rider_id: riderId,
    driver_id: driverId,
    r_to_d: { rate, comment },
  });

  return await rating.save();
};

// 2. Get Rating (by ride & rider)
export const getRiderToDriverRating = async (rideId, riderId) => {
  return await Rating.findOne(
    { ride_id: rideId, rider_id: riderId },
    { r_to_d: 1, _id: 0 }
  ).lean();
};

// 3. Update Rating
export const updateRiderToDriverRating = async (rideId, riderId, rate, comment) => {
  return await Rating.findOneAndUpdate(
    { ride_id: rideId, rider_id: riderId },
    { $set: { "r_to_d.rate": rate, "r_to_d.comment": comment } },
    { new: true }
  );
};

// 4. Delete Rating
export const deleteRiderToDriverRating = async (rideId, riderId) => {
  return await Rating.findOneAndUpdate(
    { ride_id: rideId, rider_id: riderId },
    { $unset: { r_to_d: "" } },
    { new: true }
  );
};

// ---------------- Driver → Rider (d_to_r) ----------------

// 5. Add Driver → Rider Rating
export const addDriverToRiderRating = async (rideId, driverId, riderId, rate, comment) => {
  let rating = await Rating.findOne({ ride_id: rideId, driver_id: driverId });

  if (rating) {
    rating.d_to_r = { rate, comment };
    return await rating.save();
  }

  rating = new Rating({
    ride_id: rideId,
    rider_id: riderId,
    driver_id: driverId,
    d_to_r: { rate, comment },
  });

  return await rating.save();
};

// 6. Get Driver → Rider Rating
export const getDriverToRiderRating = async (rideId, driverId) => {
  return await Rating.findOne(
    { ride_id: rideId, driver_id: driverId },
    { d_to_r: 1, _id: 0 }
  ).lean();
};

// 7. Update Driver → Rider Rating
export const updateDriverToRiderRating = async (rideId, driverId, rate, comment) => {
  return await Rating.findOneAndUpdate(
    { ride_id: rideId, driver_id: driverId },
    { $set: { "d_to_r.rate": rate, "d_to_r.comment": comment } },
    { new: true }
  );
};

// 8. Delete Driver → Rider Rating
export const deleteDriverToRiderRating = async (rideId, driverId) => {
  return await Rating.findOneAndUpdate(
    { ride_id: rideId, driver_id: driverId },
    { $unset: { d_to_r: "" } },
    { new: true }
  );
};
