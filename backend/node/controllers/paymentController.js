import paymentService from "../services/paymentService.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

class PaymentController {
  // Rider initiates add-money (create razorpay order + txn)
  async addMoney(req, res) {
    try {
      // Ensure trimming to avoid URL encoded chars (like %0D)
      const user_id = Number(String(req.params.user_id).trim());
      const amount = Number(req.body.amount);

      if (!user_id || !amount || amount <= 0) {
        return errorResponse(res, "Invalid user ID or amount", 400);
      }

      // Call payment service that talks to Python to create order + txn
      const result = await paymentService.initiateAddMoney(user_id, amount);

      // result should be an object like: { success: true, order: {...}, txn: {...} }
      if (!result.success) {
        return errorResponse(res, result.message || "Failed to initiate add money", 500);
      }

      // Send meaningful response including Razorpay order and txn ids
      return successResponse(res, "Add money initiated successfully", {
        razorpayOrder: result.order,
        transaction: result.txn,
      });
    } catch (error) {
      return errorResponse(res, error, error.statusCode || 500);
    }
  }

  // After frontend completes Razorpay checkout, calls verify
  async verifyAddMoney(req, res) {
    try {
      const { txn_id, razorpay_payment_id } = req.body;
      const out = await paymentService.verifyAddMoney(Number(txn_id), String(razorpay_payment_id));
      return successResponse(res, "Add money verification result", out);
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 500);
    }
  }

  // Driver withdraw money from wallet
  async withdraw(req, res) {
    try {
      const { user_id } = req.params;
      const { amount } = req.body;
      const out = await paymentService.initiateWithdraw(Number(user_id), Number(amount));
      return successResponse(res, "Withdrawal initiated", out);
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 500);
    }
  }

  // Rider initiates ride payment by cash/upi/wallet
  async initiateRidePayment(req, res) {
    try {
      const { ride_id } = req.params;
      const { mode } = req.body;

      if (!["cash", "upi", "wallet"].includes(mode)) {
        return errorResponse(res, "Invalid mode", 400);
      }

      // Call payment service method that also handles wallet debit if mode is wallet
      const payment = await paymentService.initiateRidePayment(Number(ride_id), mode);

      return successResponse(res, "Payment initiated", payment);
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 500);
    }
  }

  // Driver confirms ride payment collection (cash/upi)
  async confirmRidePayment(req, res) {
    try {
      const { ride_id } = req.params;
      const out = await paymentService.confirmPaymentByDriver(Number(ride_id));
      return successResponse(res, "Payment confirmed by driver", out);
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 500);
    }
  }
}

export default new PaymentController();
