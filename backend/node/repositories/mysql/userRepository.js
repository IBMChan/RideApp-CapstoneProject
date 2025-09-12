import User from "../../entities/userModel.js";

// Find a user by email
export const findByEmail = async (email) => {
  if (!email) return null;
  return await User.findOne({ where: { email } });
};

// Create a new user
export const createUser = async (data) => {
  return await User.create(data);
};