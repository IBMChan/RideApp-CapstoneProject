// entities/complaintModel.js
import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    riderId: {
      type: Number,
      ref: "User",
      required: true,
    },
    rideId: {
      type: Number,
      ref: "Ride",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Complaint = mongoose.model("Complaint", complaintSchema);
export default Complaint;
