// entities/lostItemModel.js
import mongoose from "mongoose";

const lostItemSchema = new mongoose.Schema(
  {
    item_id: {
      type: Number,
      unique: true,
      index: true,
      required: true,
    },
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
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

const LostItem = mongoose.model("LostItem", lostItemSchema);
export default LostItem;
