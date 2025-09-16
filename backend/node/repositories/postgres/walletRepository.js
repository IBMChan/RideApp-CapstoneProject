import pgSequelize from '../../config/postgreConfig.js';

class WalletRepository {
  async findAll() {
    const { rows } = await pgSequelize.query('SELECT * FROM wallet');
    return rows;
  }

  async findByUser(user_id) {
    const res = await pgSequelize.query(
      "SELECT * FROM wallet WHERE user_id = $1 LIMIT 1",
      [user_id]
    );
    return res.rows[0];
  }

  async updateBalanceByUserId(user_id, newBalance) {
    const { rows } = await pgSequelize.query(
      "UPDATE wallet SET balance = $1 WHERE user_id = $2 RETURNING *",
      [newBalance, user_id]
    );
    return rows[0];
  }

  async createForUserWithPin(user_id, pin) {
    const { rows } = await pgSequelize.query(
      "INSERT INTO wallet (user_id, balance, pin) VALUES ($1, $2, $3) RETURNING *",
      [user_id, 0.00, pin]
    );
    return rows[0];
  }

  async updateBalance(wallet_id, newBalance) {
    const { rows } = await pgSequelize.query(
      "UPDATE wallet SET balance = $1, last_updated = CURRENT_TIMESTAMP WHERE wallet_id = $2 RETURNING *",
      [newBalance, wallet_id]
    );
    return rows[0];
  }

  async updatePin(user_id, newPin) {
    const res = await pgSequelize.query(
      "UPDATE wallet SET pin = $1 WHERE user_id = $2 RETURNING *",
      [newPin, user_id]
    );
    return res.rows[0];
  }
}

export default new WalletRepository();
