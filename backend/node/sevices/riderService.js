//harshit and raksha // funcitonalities: 1. ride history 2. profile management(cloud image upload) 3. saved location (managing) 4. share status(twilio to whatsapp) 5. find a lost item/contact driver or previous rides/register a complaint
//chandana - wallet management 
//error handler

// services/rider.service.js
import Ride from "../entities/rideModel.js";
import User from "../entities/userModel.js";
import { NotFoundError, ValidationError } from "../utils/app.errors.js";

// 1. Ride history
export const getRideHistory = async (riderId) => {
  const rides = await Ride.findAll({  //from ride table
    where: { rider_id: riderId },
    include: [
      { model: User, as: "Driver", attributes: ["user_id", "full_name", "phone"] },
    ],
    order: [["ride_date", "DESC"]],
  });

  if (!rides || rides.length === 0) {
    throw new NotFoundError("No rides found for this rider.");
  }
  return rides;
};

// 2. Profile management
export const getProfile = async (riderId) => {
  const user = await User.findByPk(riderId, {
    attributes: { exclude: ["password_hash"] },
  });

  if (!user) throw new NotFoundError("Profile not found.");
  return user;
};

export const updateProfile = async (riderId, data) => {
  const user = await User.findByPk(riderId);
  if (!user) throw new NotFoundError("Profile not found.");

  // TODO: integrate AWS S3 for profile image upload later
  await user.update(data);
  return user;
};

// 3. Saved locations (PostgreSQL stub for now)
export const getSavedLocations = async (riderId) => {
  // TODO: implement using PostgreSQL model
  return [{ id: 1, label: "Home", address: "123 Main Street" }];
};

export const addSavedLocation = async (riderId, locationData) => {
  if (!locationData.label || !locationData.address) {
    throw new ValidationError("Location label and address are required.");
  }
  // TODO: persist to PostgreSQL
  return { id: Date.now(), riderId, ...locationData };
};

export const deleteSavedLocation = async (riderId, locationId) => {
  // TODO: delete from PostgreSQL
  return true;
};

// 4. Share ride status (Twilio placeholder)
export const shareRideStatus = async (riderId, rideId, phoneNumber) => {
  if (!phoneNumber) throw new ValidationError("Recipient phone number required.");

  const ride = await Ride.findByPk(rideId, {
    include: [{ model: User, as: "Driver", attributes: ["full_name", "phone"] }],
  });
  if (!ride) throw new NotFoundError("Ride not found.");

  // TODO: Integrate Twilio WhatsApp/SMS
  console.log(`Sharing ride ${rideId} with ${phoneNumber}`);
  return true;
};

// 5. Complaints + Lost items (stubs for now)
export const registerComplaint = async (riderId, rideId, data) => {
  const ride = await Ride.findOne({ where: { ride_id: rideId, rider_id: riderId } });
  if (!ride) throw new NotFoundError("Ride not found or does not belong to rider.");

  if (!data || !data.message) throw new ValidationError("Complaint message is required.");

  // TODO: Save complaint in DB
  return { complaintId: Date.now(), riderId, rideId, ...data };
};

export const getLostItems = async (riderId, rideId) => {
  const ride = await Ride.findOne({ where: { ride_id: rideId, rider_id: riderId } });
  if (!ride) throw new NotFoundError("Ride not found or does not belong to rider.");

  // TODO: Query lost items DB
  return [{ itemId: 1, description: "Black Wallet", status: "pending" }];
};
