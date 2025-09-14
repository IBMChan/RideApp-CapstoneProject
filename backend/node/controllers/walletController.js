import paymentService from "../services/paymentService.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

class WalletController {
  async debitWallet(req, res) {
    try {
      const { user_id, amount, ride_id } = req.body;
      if (!user_id || !amount) {
        return errorResponse(res, "user_id and amount are required", 400);
      }
      const result = await paymentService.debitWalletForRide(Number(user_id), Number(amount), ride_id ? Number(ride_id) : null);
      if (result.success) {
        return successResponse(res, "Wallet debited successfully", result);
      } else {
        return errorResponse(res, result.message || "Wallet debit failed", 400);
      }
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 500);
    }
  }
}

export const debitWallet = new WalletController().debitWallet.bind(new WalletController());
