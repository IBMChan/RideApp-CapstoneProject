import pgSequelize from '../../config/postgreConfig.js';
import { QueryTypes } from "sequelize";

class WalletTransactionRepository {
  async create({ wallet_id, credit = null, debit = null, status = "pending", razorpay_payment_id = null }) {
    const result = await pgSequelize.query(
      `INSERT INTO wallet_transaction (wallet_id, credit, debit, txn_date, status, razorpay_payment_id)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?) RETURNING *`,
      {
        replacements: [wallet_id, credit, debit, status, razorpay_payment_id],
        type: QueryTypes.INSERT,
      }
    );
    return result[0]?.[0] || null;
  }

  async findByRazorpayId(razorpay_payment_id) {
    if (!razorpay_payment_id) return null;

    const result = await pgSequelize.query(
      "SELECT * FROM wallet_transaction WHERE razorpay_payment_id = ? LIMIT 1",
      {
        replacements: [razorpay_payment_id],
        type: QueryTypes.SELECT,
      }
    );
    return result[0] || null;
  }

  async updateStatus(transc_id, status, razorpay_payment_id = null) {
    const result = await pgSequelize.query(
      "UPDATE wallet_transaction SET status = ?, razorpay_payment_id = COALESCE(?, razorpay_payment_id) WHERE transc_id = ? RETURNING *",
      {
        replacements: [status, razorpay_payment_id, transc_id],
        type: QueryTypes.UPDATE,
      }
    );
    return result[0]?.[0] || null;
  }

  async findAll() {
    return await pgSequelize.query("SELECT * FROM wallet_transaction", {
      type: QueryTypes.SELECT,
    });
  }

  async findByWallet(wallet_id) {
    return await pgSequelize.query(
      "SELECT * FROM wallet_transaction WHERE wallet_id = ? ORDER BY txn_date DESC",
      {
        replacements: [wallet_id],
        type: QueryTypes.SELECT,
      }
    );
  }
async findByUserId(user_id) {
    // Step 1: Get wallet_id
    const wallets = await pgSequelize.query(
      "SELECT wallet_id FROM wallet WHERE user_id = $1",
      {
        bind: [user_id],
        type: QueryTypes.SELECT,
      }
    );

    if (!wallets.length) return [];

    const walletId = wallets[0].wallet_id;

    // Step 2: Get transactions for that wallet
    return await pgSequelize.query(
      "SELECT * FROM wallet_transaction WHERE wallet_id = $1 ORDER BY txn_date DESC",
      {
        bind: [walletId],
        type: QueryTypes.SELECT,
      }
    );
  }
}

export default new WalletTransactionRepository();
