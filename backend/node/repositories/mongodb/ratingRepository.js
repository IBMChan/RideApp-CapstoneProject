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

import Ride from "../../entities/rideModel.js";   
import Rating from "../../entities/ratingModel.js" 
class RatingRepository{
    async findRideidByDriver(driverId) {
      return Ride.findAll({
        where: { driver_id: driverId },
        attributes: ['ride_id'], // only fetch ride_id
        // order: [["created_at", "DESC"]], // Uncomment if needed
      });
      }
      // Average Rating for a Driver
     async getAverageRatingByDriver(driverId) {
      const rides = await this.findRideidByDriver(driverId);
    
      const rideIds = rides.map(ride => ride.ride_id);
    
      if (!rideIds.length) {
        return { averageRating: null, totalRatings: 0 };
      }
    
      const result = await Rating.aggregate([
        { $match: { ride_id: { $in: rideIds }, "r_to_d.rate": { $ne: null } } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$r_to_d.rate" },
            totalRatings: { $sum: 1 }
          }
        }
      ]);
    
      if (result.length === 0) {
        return { averageRating: null, totalRatings: 0 };
      }
    
      return {
        averageRating: parseFloat(result[0].averageRating.toFixed(2)),
        totalRatings: result[0].totalRatings,
      };
      }
    
}

export default new RatingRepository();