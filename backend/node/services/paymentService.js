// import paymentService from "../services/paymentService.js";
// import { successResponse, errorResponse } from "../utils/apiResponse.js";

// class PaymentController {
//   // Rider initiates add-money (create razorpay order + txn)
//   async addMoney(req, res) {
//     try {
//       const user_id = Number(String(req.params.user_id).trim());
//       const amount = Number(req.body.amount);

//       if (!user_id || !amount || amount <= 0) {
//         return errorResponse(res, "Invalid user ID or amount", 400);
//       }

//       const result = await paymentService.initiateAddMoney(user_id, amount);

//       if (!result.success) {
//         return errorResponse(res, result.message || "Failed to initiate add money", 500);
//       }

//       return successResponse(res, "Add money initiated successfully", {
//         razorpayOrder: result.order,
//         transaction: result.txn,
//       });
//     } catch (error) {
//       return errorResponse(res, error, error.statusCode || 500);
//     }
//   }

//   // After frontend completes Razorpay checkout, calls verify
//   async verifyAddMoney(req, res) {
//     try {
//       const { txn_id, razorpay_payment_id } = req.body;
//       const out = await paymentService.verifyAddMoney(Number(txn_id), String(razorpay_payment_id));
//       return successResponse(res, "Add money verification result", out);
//     } catch (err) {
//       return errorResponse(res, err, err.statusCode || 500);
//     }
//   }

//   // Driver withdraw money from wallet
//   async withdraw(req, res) {
//     try {
//       const { user_id } = req.params;
//       const { amount } = req.body;
//       const out = await paymentService.initiateWithdraw(Number(user_id), Number(amount));
//       return successResponse(res, "Withdrawal initiated", out);
//     } catch (err) {
//       return errorResponse(res, err, err.statusCode || 500);
//     }
//   }

//   // Rider initiates ride payment by cash/upi/wallet
//   async initiateRidePayment(req, res) {
//     try {
//       const { ride_id } = req.params;
//       const { mode } = req.body;

//       if (!["cash", "upi", "wallet"].includes(mode)) {
//         return errorResponse(res, "Invalid mode", 400);
//       }

//       // Use paymentService method that handles wallet debit & creates payment doc accordingly
//       const payment = await paymentService.initiateRidePayment(Number(ride_id), mode);

//       return successResponse(res, "Payment initiated", payment);
//     } catch (err) {
//       return errorResponse(res, err, err.statusCode || 500);
//     }
//   }

//   // Driver confirms ride payment collection (cash/upi)
//   async confirmRidePayment(req, res) {
//     try {
//       const { ride_id } = req.params;
//       const out = await paymentService.confirmPaymentByDriver(Number(ride_id));
//       return successResponse(res, "Payment confirmed by driver", out);
//     } catch (err) {
//       return errorResponse(res, err, err.statusCode || 500);
//     }
//   }
// }

// export default new PaymentController();
import PaymentRepo from "../repositories/mongodb/paymentRepository.js";
import WalletRepository from "../repositories/postgres/walletRepository.js"
import WalletTransactionRepository from "../repositories/postgres/walletTransactionRepository.js"
import walletService from "./wallet_service.js"; // calls wallet_service.py python script
import razorpay from "../config/razorpayConfig.js";
import AppError from "../utils/appError.js";

class PaymentService {
  /**
   * Initiate ride payment after ride completion.
   * If mode === wallet:
   *    - verify walletPin
   *    - check user wallet balance >= fare
   *    - debit rider wallet, credit driver wallet, record wallet transactions
   *    - create payment doc in MongoDB with status "success"
   * If mode === upi:
   *    - create razorpay order with fare amount
   *    - generate UPI QR code link from razorpay order for frontend display
   *    - create payment doc with status "pending"
   * If mode === cash:
   *    - create payment doc with status "pending"
   *
   * @param {number} ride_id
   * @param {string} mode  "wallet" | "upi" | "cash"
   * @param {string} walletPin  required if mode==="wallet"
   * @param {number} rider_id
   */
  async initiateRidePayment(ride_id, mode, walletPin, rider_id) {
    // Fetch ride details and fare, driver_id (implement findRideById accordingly)
    const ride = await this._findRideById(ride_id);
    if (!ride) throw new AppError("Ride not found", 404);
    if (ride.status !== "completed") throw new AppError("Payment allowed only after ride completion", 400);

    const fare = ride.fare;
    const driver_id = ride.driver_id;

    if (!driver_id) throw new AppError("Ride has no assigned driver", 400);

    // Check if payment doc already exists - prevent duplicates
    const existingPayment = await PaymentRepo.findByRide(ride_id);
    if (existingPayment && existingPayment.status === "success") return existingPayment;

    if (mode === "wallet") {
      // Wallet payment flow
      if (!walletPin) throw new AppError("Wallet pin is required for wallet payments", 400);

      // Verify wallet pin (implement in walletService)
      const wallet = await WalletRepository.findByUser(rider_id);
      if (!wallet) throw new AppError("Wallet not found for user", 404);
      if (String(wallet.pin) !== String(walletPin)) throw new AppError("Invalid wallet pin", 401);

      if (parseFloat(wallet.balance) < parseFloat(fare)) {
        throw new AppError("Insufficient wallet balance. Please add money to wallet.", 400);
      }

      // Debit rider wallet
      const debitResult = await walletService.walletDebit(rider_id, fare, ride_id);
      if (!debitResult.success) {
        throw new AppError(`Wallet debit failed: ${debitResult.message}`, 400);
      }

      // Credit driver wallet
      const creditResult = await walletService.walletCredit(driver_id, fare);
      if (!creditResult.success) {
        // Optionally: refund rider wallet if driver credit fails (not shown here)
        throw new AppError(`Driver wallet credit failed: ${creditResult.message}`, 500);
      }

      // Create payment document with status 'success'
      const paymentDoc = await PaymentRepo.create({
        ride_id,
        fare,
        mode,
        status: "success",
        paidAt: new Date(),
      });

      return { payment: paymentDoc, message: "Wallet payment successful" };
    } else if (mode === "upi") {
      // UPI payment flow with Razorpay
      const amountInPaisa = Math.round(fare * 100);

      // Create Razorpay order
      const orderOptions = {
        amount: amountInPaisa,
        currency: "INR",
        receipt: `ride_rcpt_${ride_id}`,
        payment_capture: 1,
      };
      const order = await razorpay.orders.create(orderOptions);

      // Generate UPI QR link (Razorpay provides 'upi' payment method with vpa QR - if not, custom integration needed)
      // Assuming your frontend uses the order.id to generate QR code via Razorpay Checkout UI.

      // Store payment document with status pending
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
      // Cash payment flow, create pending payment doc
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

  /**
   * Driver confirms payment (only for cash or upi)
   * Changes payment status to success.
   */
  async confirmPaymentByDriver(ride_id, driver_id) {
    const payment = await PaymentRepo.findByRide(ride_id);
    if (!payment) throw new AppError("Payment not found", 404);

    if (!["cash", "upi"].includes(payment.mode)) {
      throw new AppError("Only cash/UPI payments require driver confirmation", 400);
    }

    // Validate that the driver is authorized
    const ride = await this._findRideById(ride_id);
    if (!ride || ride.driver_id !== driver_id) throw new AppError("Unauthorized driver", 403);

    if (payment.status === "success") return payment;

    const updatedPayment = await PaymentRepo.updateByRideId(ride_id, {
      status: "success",
      paidAt: new Date(),
    });

    return updatedPayment;
  }

  // Helper method to fetch ride info (you need to implement or import this)
  async _findRideById(ride_id) {
    // This function should fetch ride details from RideRepository or similar
    // For example:
    // return await RideRepository.findById(ride_id);
    // For demonstration, throwing error here
    throw new AppError("Ride fetch method not implemented", 501);
  }
}

export default new PaymentService();
