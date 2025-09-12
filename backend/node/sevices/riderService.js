//harshit and raksha // funcitonalities: 1. ride history 2. profile management(cloud image upload) 3. saved location (managing) 4. share status(twilio to whatsapp) 5. find a lost item/contact driver or previous rides/register a complaint
//chandana - wallet management 
//error handler

// services/rider.service.js
import * as rideRepository from "../repositories/ride.repository.js";
import * as userRepository from "../repositories/user.repository.js";
import * as savedLocRepository from "../repositories/savedLoc.repository.js";
import * as complaintRepository from "../repositories/complaint.repository.js";
import * as lostItemRepository from "../repositories/lostItem.repository.js";

import { NotFoundError, ValidationError } from "../utils/app.errors.js";

// --------------------- 1. Ride history ---------------------
export const getRideHistory = async (riderId) => {
  const rides = await rideRepository.findRidesByRiderId(riderId);

  if (!rides || rides.length === 0) {
    throw new NotFoundError("No rides found for this rider.");
  }
  return rides;
};

// --------------------- 2. Profile management ---------------------
export const getProfile = async (riderId) => {
  const user = await userRepository.findUserById(riderId);

  if (!user) throw new NotFoundError("Profile not found.");
  return user;
};

export const updateProfile = async (riderId, data) => {
  const user = await userRepository.findUserById(riderId);
  if (!user) throw new NotFoundError("Profile not found.");

  // TODO: integrate AWS S3 for profile image upload later
  const updatedUser = await userRepository.updateUser(riderId, data);
  return updatedUser;
};

// --------------------- 3. Saved locations (PostgreSQL) ---------------------
export const getSavedLocations = async (riderId) => {
  const locations = await savedLocRepository.findLocationsByUser(riderId);
  if (!locations || locations.length === 0) {
    throw new NotFoundError("No saved locations found.");
  }
  return locations;
};

export const addSavedLocation = async (riderId, locationData) => {
  const { label, address, latitude, longitude } = locationData;
  if (!label || !address || !latitude || !longitude) {
    throw new ValidationError("Label, address, latitude, and longitude are required.");
  }

  const existing = await savedLocRepository.findLocationByLabel(riderId, label);
  if (existing) throw new ValidationError(`Location with label '${label}' already exists.`);

  const newLoc = await savedLocRepository.createLocation(riderId, locationData);
  return newLoc;
};

export const deleteSavedLocation = async (riderId, locationId) => {
  const deleted = await savedLocRepository.deleteLocation(riderId, locationId);
  if (!deleted) throw new NotFoundError("Saved location not found or not owned by rider.");
  return true;
};

// --------------------- 4. Share ride status (Twilio placeholder) ---------------------
export const shareRideStatus = async (riderId, rideId, phoneNumber) => {
  if (!phoneNumber) throw new ValidationError("Recipient phone number required.");

  const ride = await rideRepository.findRideWithDriver(rideId);
  if (!ride) throw new NotFoundError("Ride not found.");

  // TODO: Integrate Twilio WhatsApp/SMS
  console.log(`Sharing ride ${rideId} (Rider ${riderId}) with ${phoneNumber}`);
  return true;
};

// --------------------- 5. Complaints + Lost items (MongoDB) ---------------------
export const registerComplaint = async (riderId, rideId, data) => {
  if (!data || !data.message) throw new ValidationError("Complaint message is required.");

  const ride = await rideRepository.findRideByRider(rideId, riderId);
  if (!ride) throw new NotFoundError("Ride not found or does not belong to rider.");

  const complaint = await complaintRepository.createComplaint(riderId, rideId, data.message);
  return complaint;
};

export const getLostItems = async (riderId, rideId) => {
  const ride = await rideRepository.findRideByRider(rideId, riderId);
  if (!ride) throw new NotFoundError("Ride not found or does not belong to rider.");

  const items = await lostItemRepository.findLostItemsByRide(riderId, rideId);
  if (!items || items.length === 0) {
    throw new NotFoundError("No lost items reported for this ride.");
  }

  return items;
};
