// repositories/mysql/userRepository.js
// harshit and raksha : rider functionalities.
// laxmikanth : notification and registering
// shriya : profile management, driver_status management(online, offline), register a complaint  

import User from "../../entities/userModel.js";
import mysqlSequelize from "../../config/dbConfig.js";
import { QueryTypes } from "sequelize";

export const findUserById = async (userId) => {
  const [user] = await mysqlSequelize.query(
    `SELECT user_id, full_name, phone, email, role, license, kyc_type,
            kyc_document, gender, wallet_balance, total_earnings, status,
            is_live_currently, created_at
     FROM users
     WHERE user_id = ?`,
    {
      replacements: [userId],
      type: QueryTypes.SELECT,
    }
  );
  return user || null;
};

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

// ⭐ Added: update user profile
export const updateUser = async (userId, updates) => {
  const user = await User.findByPk(userId);
  if (!user) return null;
  await user.update(updates);
  return user;
};
