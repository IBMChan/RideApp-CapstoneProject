//harshit and raksha - riders saved locations
// repositories/postgre/savedLoc.repository.js
import SavedLocation from "../../entities/savLocModel.js";

// ---------------------
// REPOSITORY FUNCTIONS
// ---------------------

// Get all saved locations for a rider
export const findLocationsByUser = async (userId) => {
  return await SavedLocation.findAll({ where: { user_id: userId } });
};

// Add a new saved location
export const createLocation = async (userId, locationData) => {
  const { label, address, latitude, longitude } = locationData;

  return await SavedLocation.create({
    user_id: userId,
    label,
    address,
    latitude,
    longitude,
  });
};

// Delete a saved location
export const deleteLocation = async (userId, savedLocId) => {
  const deleted = await SavedLocation.destroy({
    where: { saved_loc_id: savedLocId, user_id: userId },
  });
  return deleted > 0;
};

// Find location by label (to enforce uniqueness per user)
export const findLocationByLabel = async (userId, label) => {
  return await SavedLocation.findOne({
    where: { user_id: userId, label },
  });
};