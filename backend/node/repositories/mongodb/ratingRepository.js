//shriya- Rating average
//chandana -add rating 
import Ride from "../../entities/rideModel.js";   
import Rating from "../../entities/ratingModel.js" 
class RatingRepository{
    async findRideidByDriver(driverId) {
      return Ride.findAll({
        where: { driver_id: driverId },
        attributes: ['ride_id'], // only fetch ride_id
        // order: [["created_at", "DESC"]], // Uncomment if needed
      });
      }
      // Average Rating for a Driver
     async getAverageRatingByDriver(driverId) {
      const rides = await this.findRideidByDriver(driverId);
    
      const rideIds = rides.map(ride => ride.ride_id);
    
      if (!rideIds.length) {
        return { averageRating: null, totalRatings: 0 };
      }
    
      const result = await Rating.aggregate([
        { $match: { ride_id: { $in: rideIds }, "r_to_d.rate": { $ne: null } } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$r_to_d.rate" },
            totalRatings: { $sum: 1 }
          }
        }
      ]);
    
      if (result.length === 0) {
        return { averageRating: null, totalRatings: 0 };
      }
    
      return {
        averageRating: parseFloat(result[0].averageRating.toFixed(2)),
        totalRatings: result[0].totalRatings,
      };
      }
    
}

export default new RatingRepository();