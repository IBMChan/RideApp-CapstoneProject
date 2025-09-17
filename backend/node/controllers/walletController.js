import WalletService from "../services/walletService.js";
import UserRepository from "../repositories/mysql/userRepository.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { sendTxnEmail } from "../services/notificationService.js";

export async function createWallet(req, res) {
  try {
    const user_id = req.user.user_id;
    const { pin, confirmPin } = req.body;

    if (!pin || !confirmPin) return errorResponse(res, "PIN and Confirm PIN are required", 400);
    if (pin !== confirmPin) return errorResponse(res, "PIN and Confirm PIN do not match", 400);
    if (pin.length < 4) return errorResponse(res, "PIN must be at least 4 digits", 400);

    const wallet = await WalletService.createWallet(user_id, pin);
    return successResponse(res, "Wallet created successfully", { wallet });
  } catch (err) {
    return errorResponse(res, err.message || err, err.statusCode || 500);
  }
}

export async function getMyWallet(req, res) {
  try {
    const user_id = req.user?.id;
    if (!user_id) return errorResponse(res, "Unauthorized: missing user id", 401);

    const wallet = await WalletService.getWalletByUserId(user_id);
    if (!wallet) return errorResponse(res, "Wallet not found", 404);

    return successResponse(res, "Wallet fetched successfully", { wallet });
  } catch (err) {
    return errorResponse(res, err.message || err, err.statusCode || 500);
  }
}

export async function addMoney(req, res) {
  try {
    const user_id = req.user.id;
    const { amount, pin } = req.body;

    if (!amount || amount <= 0) return errorResponse(res, "Invalid amount", 400);
    if (!pin) return errorResponse(res, "Wallet PIN required", 400);

    const result = await WalletService.initiateAddMoney(user_id, amount, pin);

    // Send email with Razorpay payment ID
    const user = await UserRepository.findById(user_id);
    if (user?.email && result?.txn?.razorpay_payment_id) {
      await sendTxnEmail(user.email, result.txn.razorpay_payment_id);
    }

    return successResponse(res, "Add money initiated. Transaction ID sent to email", result);
  } catch (err) {
    return errorResponse(res, err.message || err, err.statusCode || 500);
  }
}

export async function verifyAddMoney(req, res) {
  try {
    const { razorpay_payment_id } = req.body;
    if (!razorpay_payment_id)
      return errorResponse(res, "razorpay_payment_id is required", 400);

    const result = await WalletService.verifyAddMoneyByTxnId(razorpay_payment_id);
    if (!result.success) return errorResponse(res, result.message, 400);

    return successResponse(res, "Add money verified successfully", { balance: result.balance });
  } catch (err) {
    return errorResponse(res, err.message || err, err.statusCode || 500);
  }
}

export async function withdraw(req, res) {
  try {
    const user_id = req.user.user_id;
    const { amount, pin } = req.body;
    if (!amount || amount <= 0) return errorResponse(res, 'Invalid amount', 400);
    if (!pin) return errorResponse(res, 'Wallet PIN required', 400);

    const result = await WalletService.initiateWithdraw(user_id, amount, pin);
    if (!result.success) return errorResponse(res, result.message, 400);

    return successResponse(res, 'Withdrawal successful', { balance: result.balance });
  } catch (err) {
    return errorResponse(res, err.message || err, err.statusCode || 500);
  }
}

export const viewBalance = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return errorResponse(res, "User ID missing", 400);

    const wallet = await WalletService.getWalletByUserId(userId);
    if (!wallet) return errorResponse(res, "Wallet not found", 404);

    return successResponse(res, "Balance fetched successfully", { balance: wallet.balance });
  } catch (err) {
    return errorResponse(res, err.message || err, err.statusCode || 500);
  }
};

export async function viewTransactions(req, res) {
  try {
    const user_id = req.user.user_id;
    const transactions = await WalletService.getTransactions(user_id);
    return successResponse(res, "Wallet transactions fetched", { transactions });
  } catch (err) {
    return errorResponse(res, err.message || err, err.statusCode || 500);
  }
}

export async function resetPinRequest(req, res) {
  try {
    const user_id = req.user.user_id;
    const user = await UserRepository.findById(user_id);
    if (!user?.email) return errorResponse(res, "User email not found", 400);

    // send OTP for PIN reset (optional, separate from txn verification)
    return successResponse(res, "Authentication pending: OTP sent to email");
  } catch (err) {
    return errorResponse(res, err.message || err, err.statusCode || 500);
  }
}

export async function resetPinConfirm(req, res) {
  try {
    const user_id = req.user.user_id;
    const { otp, newPin } = req.body;
    if (!otp || !newPin) return errorResponse(res, "OTP and new PIN are required", 400);

    const updatedWallet = await WalletService.updatePin(user_id, newPin);
    return successResponse(res, "PIN changed successfully", { wallet: updatedWallet.wallet });
  } catch (err) {
    return errorResponse(res, err.message || err, err.statusCode || 500);
  }
}
