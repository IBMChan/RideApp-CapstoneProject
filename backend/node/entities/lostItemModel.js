// entities/lostItemModel.js
import mongoose from "mongoose";

const lostItemSchema = new mongoose.Schema(
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
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["reported", "returned", "unresolved"],
      default: "reported",
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const LostItem = mongoose.model("LostItem", lostItemSchema, "lost_items");
export default LostItem;
