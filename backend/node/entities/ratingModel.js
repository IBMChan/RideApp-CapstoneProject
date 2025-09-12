const ratingSchema = new mongoose.Schema({
  rating_id:{
    type:Number,
    default: async function () {
      const count = await mongoose.models.Rating.countDocuments();
      return count + 1;   // e.g., 1, 2, 3, 4...
    },
    unique: true
  },
  ride_id: {
      type: Number,   // reference to MySQL ride.ride_id
      required: true,
      index: true
  },
  r_to_d: { 
    rate: Number,
    comment: String,
  },
  d_to_r: { 
    rate: Number,
    comment: String,
  },
});

const Rating = model("Rating", ratingSchema);

export default Rating;