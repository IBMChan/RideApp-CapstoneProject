//harshit and raksha : rider functionalities.
//laxmikanth : notfication and registering
// shriya : profile managemnetdr_status management(online, offline) , register a complaint  
import User from "../../entities/userModel.js";

export const findByEmail = async (email) => {
  if (!email) return null;
  return await User.findOne({ where: { email } });
};

export const createUser = async (data) => {
  return await User.create(data);
};

export const updatePasswordByEmail = async (email, password_hash) => {
  const user = await User.findOne({ where: { email } });
  if (!user) return null;
  user.password_hash = password_hash;
  await user.save();
  return user;
};