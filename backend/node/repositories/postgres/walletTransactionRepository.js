import pgSequelize from '../../config/postgreConfig.js';

class WalletTransactionRepository {
  async create({ wallet_id, credit = null, debit = null, status = "pending", razorpay_payment_id = null }) {
    const { rows } = await pgSequelize.query(
      `INSERT INTO wallet_transaction (wallet_id, credit, debit, txn_date, status, razorpay_payment_id)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5) RETURNING *`,
      [wallet_id, credit, debit, status, razorpay_payment_id]
    );
    return rows[0];
  }

  async findById(transc_id) {
    const { rows } = await pgSequelize.query(
      "SELECT * FROM wallet_transaction WHERE transc_id = $1",
      [transc_id]
    );
    return rows[0];
  }

async findByRazorpayId(razorpay_payment_id) {
  if (!razorpay_payment_id) return null;

  const { rows } = await pgSequelize.query(
    "SELECT * FROM wallet_transaction WHERE razorpay_payment_id = $1 LIMIT 1",
    [razorpay_payment_id]  // <-- parameter array MUST be here
  );

  return rows[0] || null;
}


  async updateStatus(transc_id, status, razorpay_payment_id = null) {
    const { rows } = await pgSequelize.query(
      "UPDATE wallet_transaction SET status = $1, razorpay_payment_id = COALESCE($2, razorpay_payment_id) WHERE transc_id = $3 RETURNING *",
      [status, razorpay_payment_id, transc_id]
    );
    return rows[0];
  }

  async findAll() {
    const { rows } = await pgSequelize.query('SELECT * FROM wallet_transaction');
    return rows;
  }

  async findByWallet(wallet_id) {
    const { rows } = await pgSequelize.query(
      "SELECT * FROM wallet_transaction WHERE wallet_id = $1 ORDER BY txn_date DESC",
      [wallet_id]
    );
    return rows;
  }
}

export default new WalletTransactionRepository();
