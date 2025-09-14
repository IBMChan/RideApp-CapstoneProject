import PaymentRepo from "../repositories/mongodb/paymentRepository.js";
import pythonService from "./pythonService.js";
import WalletRepo from "../repositories/postgres/walletRepository.js";
import WalletTxnRepo from "../repositories/postgres/walletTransactionRepository.js";
import AppError from "../utils/appError.js";

class PaymentService {
  // Create or find existing payment for a ride
  async createPaymentForRide({ ride_id, fare = 0, mode = "cash" }) {
    let existing = await PaymentRepo.findByRide(ride_id);
    if (existing) return existing;
    return PaymentRepo.create({ ride_id, fare, mode });
  }

  async getPaymentByRide(ride_id) {
    return PaymentRepo.findByRide(ride_id);
  }

  async confirmPaymentByDriver(ride_id) {
    const payment = await PaymentRepo.findByRide(ride_id);
    if (!payment) throw new AppError("Payment not found", 404);
    if (payment.status === "success") return payment;
    return PaymentRepo.updateByRideId(ride_id, { status: "success", Payed_At: new Date() });
  }

  // Wallet flows via Python service
  async initiateAddMoney(user_id, amount) {
    return pythonService.walletCredit(user_id, amount);
  }

  async verifyAddMoney(txn_id, razorpay_payment_id) {
    return pythonService.walletVerify(txn_id, razorpay_payment_id);
  }

  async debitWalletForRide(user_id, amount, ride_id) {
    return pythonService.walletDebit(user_id, amount, ride_id);
  }

  async initiateWithdraw(user_id, amount) {
    return pythonService.walletWithdraw(user_id, amount);
  }

  async initiatePayment(riderId, ride_id, fare, mode) {
    // Your rideRepository import needed here if used, or adjust accordingly
    const ride = await PaymentRepo.findByRide(ride_id); // or appropriate ride repo call
    if (!ride) throw new AppError("Ride not found", 404);

    if (!["completed", "in_progress"].includes(ride.status)) {
      throw new AppError("Ride must be in progress or completed to pay", 400);
    }

    const payment = await PaymentRepo.create({
      ride_id,
      fare,
      mode,
      status: "pending",
    });
    return payment;
  }

  async confirmPayment(driverId, payment_id) {
    const payment = await PaymentRepo.findById(payment_id);
    if (!payment) throw new AppError("Payment not found", 404);

    if (!["cash", "upi"].includes(payment.mode)) {
      throw new AppError("Only cash/UPI payments require driver confirmation", 400);
    }

    payment.status = "success";
    payment.Payed_At = new Date();
    await payment.save();
    return payment;
  }
}

export default new PaymentService();
