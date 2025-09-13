// repositories/mongo/complaint.repository.js
import Complaint from "../../entities/complaintModel.js";

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
  return await Complaint.findOne({ rideId, riderId });
};

export const updateComplaintStatus = async (complaintId, status) => {
  return await Complaint.findByIdAndUpdate(
    complaintId,
    { status },
    { new: true }
  );
};
