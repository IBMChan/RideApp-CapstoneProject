import pool from "../../config/postgresConfig.js";

class WalletTransactionRepository {
  async create({ wallet_id, credit = null, debit = null, status = "pending", razorpay_payment_id = null }) {
    const { rows } = await pool.query(
      `INSERT INTO wallet_transaction (wallet_id, credit, debit, txn_date, status, razorpay_payment_id)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5) RETURNING *`,
      [wallet_id, credit, debit, status, razorpay_payment_id]
    );
    return rows[0];
  }

  async findById(txn_id) {
    const { rows } = await pool.query("SELECT * FROM wallet_transaction WHERE transc_id = $1", [txn_id]);
    return rows[0];
  }

  async updateStatus(txn_id, status, razorpay_payment_id = null) {
    const { rows } = await pool.query(
      "UPDATE wallet_transaction SET status = $1, razorpay_payment_id = COALESCE($2, razorpay_payment_id) WHERE transc_id = $3 RETURNING *",
      [status, razorpay_payment_id, txn_id]
    );
    return rows[0];
  }

  // New method to fetch transactions by wallet_id, most recent first
  async findByWallet(wallet_id) {
    const { rows } = await pool.query(
      "SELECT * FROM wallet_transaction WHERE wallet_id = $1 ORDER BY txn_date DESC",
      [wallet_id]
    );
    return rows;
  }
}

export default new WalletTransactionRepository();
