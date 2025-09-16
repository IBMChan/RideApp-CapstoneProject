import WalletService from "../services/walletService.js";
import UserRepository from "../repositories/mysql/userRepository.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { sendEmailOTP, verifyOTP } from "../services/notificationService.js";

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

export async function addMoney(req, res) {
  try {
    const user_id = req.user.user_id;
    const { amount, pin } = req.body;
    if (!amount || amount <= 0) return errorResponse(res, "Invalid amount", 400);
    if (!pin) return errorResponse(res, "Wallet PIN required", 400);

    const result = await WalletService.initiateAddMoney(user_id, amount, pin);
    return successResponse(res, "Add money initiated", result);
  } catch (err) {
    return errorResponse(res, err.message || err, err.statusCode || 500);
  }
}

export async function verifyAddMoney(req, res) {
  try {
    const { txn_id, razorpay_payment_id } = req.body;
    if (!txn_id || !razorpay_payment_id) return errorResponse(res, "txn_id and razorpay_payment_id required", 400);

    const result = await WalletService.verifyAddMoney(txn_id, razorpay_payment_id);
    return successResponse(res, "Add money verification result", result);
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

export async function viewBalance(req, res) {
  try {
    const user_id = req.user.user_id;
    const balance = await WalletService.getBalance(user_id);
    return successResponse(res, "Wallet balance fetched", { balance });
  } catch (err) {
    return errorResponse(res, err.message || err, err.statusCode || 500);
  }
}

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

    const otpResult = await sendEmailOTP(user.email);
    if (!otpResult.success) return errorResponse(res, "Failed to send OTP email", 500);

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

    const user = await UserRepository.findById(user_id);
    if (!user?.email) return errorResponse(res, "User email not found", 400);

    const verification = verifyOTP(user.email, otp);
    if (!verification.valid) return errorResponse(res, verification.message, 400);

    const updatedWallet = await WalletService.updatePin(user_id, newPin);
    return successResponse(res, "PIN changed successfully", { wallet: updatedWallet.wallet });
  } catch (err) {
    return errorResponse(res, err.message || err, err.statusCode || 500);
  }
}
