import pgSequelize from "../../config/postgreConfig.js";
import { QueryTypes } from "sequelize";

class WalletRepository {
  async findAll() {
    return await pgSequelize.query("SELECT * FROM wallet", {
      type: QueryTypes.SELECT,
    });
  }

  async findByUser(userId) {
    console.log("🔍 Running wallet query with userId:", userId);
    const result = await pgSequelize.query(
      "SELECT * FROM wallet WHERE user_id = ? LIMIT 1",
      {
        replacements: [userId],
        type: QueryTypes.SELECT,
      }
    );
    return result[0] || null; // return single wallet or null
  }

  async findById(wallet_id) {
  const result = await pgSequelize.query(
    "SELECT * FROM wallet WHERE wallet_id = ? LIMIT 1",
    {
      replacements: [wallet_id],
      type: QueryTypes.SELECT,
    }
  );
  return result[0] || null;
}


  async updateBalanceByUserId(user_id, newBalance) {
    const result = await pgSequelize.query(
      "UPDATE wallet SET balance = ? WHERE user_id = ? RETURNING *",
      {
        replacements: [newBalance, user_id],
        type: QueryTypes.UPDATE,
      }
    );
    return result[0]?.[0] || null;
  }

  async createForUserWithPin(user_id, pin) {
    const result = await pgSequelize.query(
      "INSERT INTO wallet (user_id, balance, pin) VALUES (?, ?, ?) RETURNING *",
      {
        replacements: [user_id, 0.0, pin],
        type: QueryTypes.INSERT,
      }
    );
    return result[0]?.[0] || null;
  }

  async updateBalance(wallet_id, newBalance) {
    const result = await pgSequelize.query(
      "UPDATE wallet SET balance = ?, last_updated = CURRENT_TIMESTAMP WHERE wallet_id = ? RETURNING *",
      {
        replacements: [newBalance, wallet_id],
        type: QueryTypes.UPDATE,
      }
    );
    return result[0]?.[0] || null;
  }

  async updatePin(user_id, newPin) {
    const result = await pgSequelize.query(
      "UPDATE wallet SET pin = ? WHERE user_id = ? RETURNING *",
      {
        replacements: [newPin, user_id],
        type: QueryTypes.UPDATE,
      }
    );
    return result[0]?.[0] || null;
  }

  async existsForUser(user_id) {
    const result = await pgSequelize.query(
      "SELECT wallet_id FROM wallet WHERE user_id = ? LIMIT 1",
      {
        replacements: [user_id],
        type: QueryTypes.SELECT,
      }
    );
    return result.length > 0;
  }
  async getWalletByUserId(user_id) {
  return await WalletRepository.findByUser(user_id) || null;
}

}

export default new WalletRepository();
