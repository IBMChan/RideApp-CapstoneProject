//harshit and raksha // funcitonalities: 1. ride history 2. profile management(cloud image upload) 3. saved location (managing) 4. share status(twilio to whatsapp) 5. find a lost item/contact driver or previous rides/register a complaint
//chandana - wallet management 
//error handler

// services/rider.service.js
import nodemailer from "nodemailer";
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

  // --------------------- 4. Share Ride Status (Email only) ---------------------
  async shareRideStatus(riderId, rideId, recipientEmail) {
    if (!recipientEmail) {
      throw new ValidationError("Recipient email is required.");
    }

    // 1. Fetch ride
    const ride = await rideRepository.findById(rideId);
    if (!ride) throw new NotFoundError("Ride not found.");

    // 2. Fetch driver
    const driver = await userRepository.findById(ride.driver_id);
    if (!driver) throw new NotFoundError("Driver not found.");
    // console.log(driver);
    
    // 3. Fetch vehicle
    let vehicle = null;
    if (ride.vehicle_id) {
      try {
        const vehicleRepo = await import("../repositories/mysql/vehicleRepository.js");
        vehicle = await vehicleRepo.default.findById(ride.vehicle_id);
      } catch (err) {
        console.warn("Vehicle fetch failed:", err.message);
      }
    }

  const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true", // true = 465, false = 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


    // 5. Email body
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: "Ride Status Update",
      html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #f9f9f9; padding: 20px; border-radius: 12px; border: 1px solid #e0e0e0; color: #333;">
    <h2 style="text-align: center; color: #2E86C1; margin-bottom: 20px;">🚖 Ride Status Update</h2>
    
    <div style="background: #fff; padding: 15px 20px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
      <h3 style="color: #117A65; margin-top: 0;">Ride Details</h3>
      <p><b>Ride ID:</b> ${ride.ride_id}</p>
      <p><b>Pickup:</b> ${ride.pickup_loc}</p>
      <p><b>Drop:</b> ${ride.drop_loc}</p>
      <p><b>Status:</b> <span style="color: ${ride.status === "completed" ? "green" : "orange"}; font-weight: bold;">${ride.status}</span></p>
    </div>

    <div style="background: #fff; padding: 15px 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
      <h3 style="color: #B03A2E; margin-top: 0;">Driver Details</h3>
      <p><b>Name:</b> ${driver.full_name}</p>
      <p><b>Phone:</b> ${driver.phone}</p>
      <p><b>Email:</b> ${driver.email}</p>
      ${vehicle ? `<p><b>Vehicle:</b> ${vehicle.make} ${vehicle.model} (${vehicle.plate_no})</p>` : ""}
    </div>

    <p style="font-size: 0.9em; color: #666; margin-top: 20px; text-align: center;">
      Stay in touch with the rider during their trip.  
      <br/>This update is sent automatically by <b>RideApp</b> for safety.
    </p>
  </div>`
    };

    // 6. Send
    await transporter.sendMail(mailOptions);

    return { success: true, message: "Ride status shared via email." };
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

    const wallet = await walletRepository.getWalletByUserId(user_id);
    const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
    await walletRepository.updateBalance(wallet.wallet_id, newBalance);

    await walletTransactionRepository.addTransaction(wallet.wallet_id, amount, null);

    return { success: true, newBalance };
  }

// --------------------- SOS Functionality ---------------------
async sendSOS(riderId, recipientEmail, customMessage) {
  const rider = await userRepository.findById(riderId);
  if (!rider) throw new NotFoundError("Rider not found");

  const ride = await rideRepository.getLatestRideByRider(riderId);
  const driver = ride ? await userRepository.findById(ride.driver_id) : null;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // ✅ Friendly + formatted SOS message
  const htmlMessage = customMessage || `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #d9534f;">🚨 Emergency Alert 🚨</h2>
      <p>
        You are receiving this email because you are listed as an 
        <strong>emergency contact</strong> for 
        <strong>${rider.full_name || "Your Contact"}</strong>.
      </p>
      <p>
        They have triggered an <strong>SOS alert</strong>. 
        Please try to reach them immediately and ensure their safety.
      </p>
      
      <h3 style="margin-top: 20px; color: #555;">🚖 Ride Details</h3>
      <ul>
        <li><strong>Pickup:</strong> ${ride?.pickup_loc || "Not available"}</li>
        <li><strong>Drop:</strong> ${ride?.drop_loc || "Not available"}</li>
      </ul>

      <h3 style="margin-top: 20px; color: #555;">👨‍✈️ Driver Details</h3>
      <ul>
        <li><strong>Name:</strong> ${driver?.full_name || "Not available"}</li>
        <li><strong>Phone:</strong> ${driver?.phone || "Not available"}</li>
        <li><strong>Email:</strong> ${driver?.email || "Not available"}</li>
      </ul>

      <p style="margin-top: 25px; font-size: 14px; color: #777;">
        This is an automated message from <strong>RideApp</strong>. 
        Please take necessary action.
      </p>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: "🚨 SOS Alert - Immediate Attention Needed",
    html: htmlMessage, // ✅ Use HTML instead of plain text
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: "SOS alert sent successfully" };
  } catch (error) {
    console.error("❌ Error sending SOS:", error);
    throw new Error("Failed to send SOS email");
  }
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


export default new RideService();
