import PaymentRepo from "../repositories/mongodb/paymentRepository.js";
import WalletRepository from "../repositories/postgres/walletRepository.js";
import WalletTransactionRepository from "../repositories/postgres/walletTransactionRepository.js";
import walletService from "./walletService.js"; 
import razorpay from "../config/razorpayConfig.js";
import AppError from "../utils/appError.js";
import RideRepository from "../repositories/mysql/ridesRepository.js"; // ✅ import ride repo

class PaymentService {
  async initiateRidePayment(ride_id, mode, walletPin, rider_id) {
    const ride = await this._findRideById(ride_id); // ✅ fetch ride properly
    if (!ride) throw new AppError("Ride not found", 404);
    if (ride.status !== "completed") {
      throw new AppError("Payment allowed only after ride completion", 400);
    }

    const fare = ride.fare;
    const driver_id = ride.driver_id;
    if (!driver_id) throw new AppError("Ride has no assigned driver", 400);

    // prevent duplicate success payments
    const existingPayment = await PaymentRepo.findByRide(ride_id);
    if (existingPayment && existingPayment.status === "success") {
      return existingPayment;
    }

    if (mode === "wallet") {
      if (!walletPin) throw new AppError("Wallet pin is required for wallet payments", 400);

      const wallet = await WalletRepository.findByUser(rider_id);
      if (!wallet) throw new AppError("Wallet not found for user", 404);
      if (String(wallet.pin) !== String(walletPin)) throw new AppError("Invalid wallet pin", 401);

      if (parseFloat(wallet.balance) < parseFloat(fare)) {
        throw new AppError("Insufficient wallet balance. Please add money to wallet.", 400);
      }

      // debit rider wallet
      const debitResult = await walletService.walletDebit(rider_id, fare, ride_id);
      if (!debitResult.success) throw new AppError(`Wallet debit failed: ${debitResult.message}`, 400);

      // credit driver wallet
      const creditResult = await walletService.walletCredit(driver_id, fare);
      if (!creditResult.success) {
        throw new AppError(`Driver wallet credit failed: ${creditResult.message}`, 500);
      }

      const paymentDoc = await PaymentRepo.create({
        ride_id,
        fare,
        mode,
        status: "success",
        paidAt: new Date(),
      });

      return { payment: paymentDoc, message: "Wallet payment successful" };
    } else if (mode === "upi") {
      const amountInPaisa = Math.round(fare * 100);

      const orderOptions = {
        amount: amountInPaisa,
        currency: "INR",
        receipt: `ride_rcpt_${ride_id}`,
        payment_capture: 1,
      };
      const order = await razorpay.orders.create(orderOptions);

      const paymentDoc = await PaymentRepo.create({
        ride_id,
        fare,
        mode,
        status: "pending",
        razorpayOrderId: order.id,
      });

      return {
        payment: paymentDoc,
        razorpayOrder: order,
        message: "UPI payment initiated. Please complete payment using the provided QR code.",
      };
    } else if (mode === "cash") {
      const paymentDoc = await PaymentRepo.create({
        ride_id,
        fare,
        mode,
        status: "pending",
      });

      return { payment: paymentDoc, message: "Cash payment initiated, to be confirmed by driver." };
    } else {
      throw new AppError("Unsupported payment mode", 400);
    }
  }

  async confirmPaymentByDriver(ride_id, driver_id) {
    const payment = await PaymentRepo.findByRide(ride_id);
    if (!payment) throw new AppError("Payment not found", 404);

    if (!["cash", "upi"].includes(payment.mode)) {
      throw new AppError("Only cash/UPI payments require driver confirmation", 400);
    }

    const ride = await this._findRideById(ride_id);
    if (!ride || ride.driver_id !== driver_id) throw new AppError("Unauthorized driver", 403);

    if (payment.status === "success") return payment;

    const updatedPayment = await PaymentRepo.updateByRideId(ride_id, {
      status: "success",
      paidAt: new Date(),
    });

    return updatedPayment;
  }

  // ✅ Now fetches ride from RideRepository
  async _findRideById(ride_id) {
    const ride = await RideRepository.findById(ride_id);
    if (!ride) throw new AppError("Ride not found", 404);
    return ride;
  }
}

export default new PaymentService();
