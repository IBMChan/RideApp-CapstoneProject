// repositories/mongo/lostItem.repository.js
import LostItem from "../../entities/lostItemModel.js";

// ------------------
// Repository Methods
// ------------------

export const reportLostItem = async (riderId, rideId, description) => {
  const item = new LostItem({ riderId, rideId, description });
  return await item.save();
};

export const findLostItemsByRide = async (riderId, rideId) => {
  return await LostItem.find({ riderId, rideId }).sort({ reportedAt: -1 });
};

export const updateLostItemStatus = async (itemId, status) => {
  return await LostItem.findByIdAndUpdate(itemId, { status }, { new: true });
};
