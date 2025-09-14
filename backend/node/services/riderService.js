import walletRepository from "../repositories/postgres/walletRepository.js";
import walletTransactionRepository from "../repositories/postgres/walletTransactionRepository.js";
import paymentService from "./paymentService.js";

class RiderService {
  async addMoney(user_id, amount) {
    // log txn in DB
    const txn = await walletTransactionRepository.create({
      user_id,
      amount,
      txn_type: "credit",
      status: "pending",
    });

    // delegate to Python for Razorpay integration
    const result = await paymentService.addMoney({ user_id, amount });

    return { txn, result };
  }
}

export default new RiderService();
