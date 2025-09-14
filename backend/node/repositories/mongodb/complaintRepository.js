// repositories/mongodb/complaintRepository.js
import Complaint from "../../entities/complainModel.js";

// ------------------
// Repository Methods
// ------------------

export const createComplaint = async (riderId, rideId, message) => {
  const complaint = new Complaint({ riderId, rideId, message });
  return await complaint.save();
};

export const findComplaintsByRider = async (riderId) => {
  return await Complaint.find({ riderId }).sort({ createdAt: -1 });
};

export const findComplaintByRide = async (rideId, riderId) => {
  // both rideId and riderId are Numbers
  return await Complaint.findOne({ rideId, riderId });
};

export const updateComplaintStatus = async (complaintId, status) => {
  // complaintId here is Mongo’s internal _id
  return await Complaint.findByIdAndUpdate(
    complaintId,
    { status },
    { new: true }
  );
};
