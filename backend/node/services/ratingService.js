// rating functionalities(r_to_d, d_to_r) 
// Raksha & Harshit 

import * as ratingRepository from "../repositories/mongodb/ratingRepository.js";

import { NotFoundError, ValidationError } from "../utils/appError.js";

class RatingService {
     // --------------------- 7. Ratings ---------------------

  // Rider → Driver
  async rateDriver(riderId, rideId, driverId, rate, comment) {
    if (!rate || rate < 1 || rate > 5) {
      throw new ValidationError("Rating must be between 1 and 5.");
    }
    return await ratingRepository.addRiderToDriverRating(rideId, riderId, driverId, rate, comment);
  }

  async getDriverRating(rideId, riderId) {
    return await ratingRepository.getRiderToDriverRating(rideId, riderId);
  }

  async updateDriverRating(riderId, rideId, { rate, comment }) {
    if (rate && (rate < 1 || rate > 5)) {
      throw new ValidationError("Rating must be between 1 and 5.");
    }
    return await ratingRepository.updateRiderToDriverRating(rideId, riderId, rate, comment);
  }

  async deleteDriverRating(rideId, riderId) {
    return await ratingRepository.deleteRiderToDriverRating(rideId, riderId);
  }

  // Driver → Rider
  async rateRider(driverId, rideId, riderId, rate, comment) {
    if (!rate || rate < 1 || rate > 5) {
      throw new ValidationError("Rating must be between 1 and 5.");
    }
    return await ratingRepository.addDriverToRiderRating(rideId, driverId, riderId, rate, comment);
  }

  async getRiderRating(rideId, driverId) {
    return await ratingRepository.getDriverToRiderRating(rideId, driverId);
  }

  async updateRiderRating(driverId, riderId, { rate, comment }) {
  if (!rate || rate < 1 || rate > 5) {
    throw new ValidationError("Rate must be between 1 and 5");
  }

  const updated = await ratingRepository.updateDriverToRiderRating(driverId, riderId, { rate, comment });
  return updated;
}

  async deleteRiderRating(rideId, driverId) {
    return await ratingRepository.deleteDriverToRiderRating(rideId, driverId);
  }
}
export default new RatingService();