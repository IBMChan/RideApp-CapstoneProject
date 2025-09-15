// Raksha & Harshit 
import mongoose, { Schema, model } from "mongoose";

const ratingSchema = new Schema(
  {
    ride_id: {
      type: Number, // reference to MySQL ride.ride_id
      required: true,
      index: true,
    },
    rider_id: {
      type: Number, // MySQL users.user_id
      required: true,
    },
    driver_id: {
      type: Number, // MySQL users.user_id
      required: true,
    },
    r_to_d: {
      rate: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true },
    },
    d_to_r: {
      rate: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

const Rating = model("Rating", ratingSchema);
export default Rating;
