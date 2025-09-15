//harshit and raksha // funcitonalities: 1. ride history 2. profile management(cloud image upload) 3. saved location (managing) 4. share status(twilio to whatsapp) 5. find a lost item/contact driver or previous rides/register a complaint
//chandana - wallet management 
//error handler

// services/rider.service.js
import rideRepository from "../repositories/mysql/ridesRepository.js";
import userRepository, { findUserById } from "../repositories/mysql/userRepository.js";
import * as savedLocRepository from "../repositories/postgres/saveLocRepository.js";
import * as complaintRepository from "../repositories/mongodb/complaintRepository.js";
import * as lostItemRepository from "../repositories/mongodb/lostItemRepository.js";
import * as ratingRepository from "../repositories/mongodb/ratingRepository.js";
import * as walletRepository from "../repositories/postgres/walletRepository.js";


import { NotFoundError, ValidationError } from "../utils/appError.js";

class RideService {
  // --------------------- 1. Ride history ---------------------
  async getRideHistory(riderId) {
    const rides = await rideRepository.getRidesByRider(riderId);
    if (!rides || rides.length === 0) {
      throw new NotFoundError("No rides found for this rider.");
    }
    return rides;
  }

  // --------------------- 2. Profile ---------------------
  async getProfile(riderId) {
    const user = await findUserById(riderId);
    if (!user) throw new NotFoundError("Profile not found.");
    return user;
  }

  async updateProfile(riderId, data) {
    const user = await findUserById(riderId);
    if (!user) throw new NotFoundError("Profile not found.");
    return await userRepository.updateUser(riderId, data);
  }

  // --------------------- 3. Saved Locations ---------------------
  async getSavedLocations(riderId) {
    const locations = await savedLocRepository.findLocationsByUser(riderId);
    if (!locations || locations.length === 0) {
      throw new NotFoundError("No saved locations found.");
    }
    return locations;
  }

  async addSavedLocation(riderId, locationData) {
    const { label, address, latitude, longitude } = locationData;
    if (!label || !address || !latitude || !longitude) {
      throw new ValidationError("Label, address, latitude, and longitude are required.");
    }
    const existing = await savedLocRepository.findLocationByLabel(riderId, label);
    if (existing) throw new ValidationError(`Location with label '${label}' already exists.`);
    return await savedLocRepository.createLocation(riderId, locationData);
  }

  async deleteSavedLocation(riderId, locationId) {
    const deleted = await savedLocRepository.deleteLocation(riderId, locationId);
    if (!deleted) throw new NotFoundError("Saved location not found or not owned by rider.");
    return true;
  }

  // --------------------- 4. Share Ride Status ---------------------
  async shareRideStatus(riderId, rideId, phoneNumber) {
    if (!phoneNumber) throw new ValidationError("Recipient phone number required.");
    const ride = await rideRepository.findRideWithDriver(rideId);
    if (!ride) throw new NotFoundError("Ride not found.");
    console.log(`Sharing ride ${rideId} (Rider ${riderId}) with ${phoneNumber}`);
    return true;
  }

  // --------------------- 5. Complaints & Lost Items ---------------------
  async registerComplaint(riderId, rideId, data) {
    if (!data || !data.message) throw new ValidationError("Complaint message is required.");
    const ride = await rideRepository.getRideById(rideId);
    if (!ride || ride.rider_id !== riderId) {
      throw new NotFoundError("Ride not found or does not belong to rider.");
    }
    return await complaintRepository.createComplaint(riderId, rideId, data.message);
  }

  async getComplaints(riderId) {
    const complaints = await complaintRepository.findComplaintsByRider(riderId);
    if (!complaints || complaints.length === 0) {
      throw new NotFoundError("No complaints found for this rider.");
    }
    return complaints;
  }

  async getLostItems(riderId, rideId) {
    const items = await lostItemRepository.findLostItemsByRide(riderId, rideId);
    if (!items || items.length === 0) {
      throw new NotFoundError("No lost items reported for this ride.");
    }
    return items;
  }

  async reportLostItem(riderId, rideId, itemData) {
    if (!itemData || !itemData.description) {
      throw new ValidationError("Lost item description is required.");
    }
    const ride = await rideRepository.getRideById(rideId);
    if (!ride || ride.rider_id !== riderId) {
      throw new NotFoundError("Ride not found or does not belong to rider.");
    }
    return await lostItemRepository.reportLostItem(riderId, rideId, itemData.description);
  }

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

  async updateRiderRating(driverId, rideId, { rate, comment }) {
    if (rate && (rate < 1 || rate > 5)) {
      throw new ValidationError("Rating must be between 1 and 5.");
    }
    return await ratingRepository.updateDriverToRiderRating(rideId, driverId, rate, comment);
  }

  async deleteRiderRating(rideId, driverId) {
    return await ratingRepository.deleteDriverToRiderRating(rideId, driverId);
  }
}

export default new RideService();
