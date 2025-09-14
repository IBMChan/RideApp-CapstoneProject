import pool from "../../config/postgres.js";

class WalletRepository {
  async findByUser(user_id) {
    const { rows } = await pool.query("SELECT * FROM wallet WHERE user_id = $1", [user_id]);
    return rows[0];
  }

  async createForUser(user_id) {
    const { rows } = await pool.query(
      "INSERT INTO wallet (user_id, balance) VALUES ($1, $2) RETURNING *",
      [user_id, 0.00]
    );
    return rows[0];
  }

  async updateBalance(wallet_id, newBalance) {
    const { rows } = await pool.query(
      "UPDATE wallet SET balance = $1, last_updated = CURRENT_TIMESTAMP WHERE wallet_id = $2 RETURNING *",
      [newBalance, wallet_id]
    );
    return rows[0];
  }
}

export default new WalletRepository();
