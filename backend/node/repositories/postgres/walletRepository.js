import pool from "../../config/postgresConfig.js";

class WalletRepository {
  async findByUser(user_id) {
    const { rows } = await pool.query("SELECT * FROM wallet WHERE user_id = $1", [user_id]);
    return rows[0];
  }


    async createForUserWithPin(user_id, pin) {
    const { rows } = await pool.query(
      "INSERT INTO wallet (user_id, balance, pin) VALUES ($1, $2, $3) RETURNING *",
      [user_id, 0.00, pin]
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

  async updatePin(user_id, newPin) {
    const { rows } = await pool.query(
      "UPDATE wallet SET pin = $1, last_updated = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *",
      [newPin, user_id]
    );
    return rows[0];
  }
}

export default new WalletRepository();
