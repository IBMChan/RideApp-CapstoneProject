import rideRepository from "../repositories/mysql/ridesRepository.js";
import userRepository, { findUserById } from "../repositories/mysql/userRepository.js";
import * as savedLocRepository from "../repositories/postgres/saveLocRepository.js";
import * as complaintRepository from "../repositories/mongodb/complaintRepository.js";
import * as lostItemRepository from "../repositories/mongodb/lostItemRepository.js";

import * as walletRepository from "../repositories/postgres/walletRepository.js";
import walletTransactionRepository from "../repositories/postgres/walletTransactionRepository.js";
import { spawnPythonPayment } from "../config/razorpayConfig.js";
// import razorpay from "../config/razorpayConfig.js"

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

  // --------------------- 6. Wallet (via Python Razorpay) ---------------------
  async addMoney({ user_id, amount, payment_method, bank_details }) {
    // call Python wrapper
    const paymentResult = await spawnPythonPayment({
      action: "create_order",
      amount,
      currency: "INR",
      user_id,
      payment_method,
      bank_details
    });

    if (!paymentResult.success) {
      throw new Error("Payment failed");
    }

    // update wallet balance
    const wallet = await walletRepository.getWalletByUserId(user_id);
    const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
    await walletRepository.updateBalance(wallet.wallet_id, newBalance);

    // log transaction
    await walletTransactionRepository.addTransaction(wallet.wallet_id, amount, null);

    return { success: true, newBalance };
  }
}

export default new RideService();
