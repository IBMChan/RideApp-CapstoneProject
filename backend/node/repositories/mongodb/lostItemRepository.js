// repositories/mongodb/lostItemRepository.js
import LostItem from "../../entities/lostItemModel.js";

// ------------------
// Repository Methods
// ------------------

export const reportLostItem = async (riderId, rideId, description) => {
  const item = new LostItem({ riderId, rideId, description });
  return await item.save();
};

export const findLostItemsByRide = async (rideId, riderId) => {
  // both rideId and riderId are Numbers
  return await LostItem.find({ rideId, riderId }).sort({ reportedAt: -1 });
};

export const updateLostItemStatus = async (itemId, status) => {
  // itemId here is Mongo’s internal _id
  return await LostItem.findByIdAndUpdate(itemId, { status }, { new: true });
};
