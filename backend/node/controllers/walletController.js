import WalletService from "../services/walletService.js";
import UserRepository from "../repositories/mysql/userRepository.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { sendEmailOTP, verifyOTP } from "../services/notificationService.js"; // your provided otp service

export async function createWallet(req, res) {
  try {
    const user_id = req.user.user_id;
    const { pin, confirmPin } = req.body;

    if (!pin || !confirmPin) {
      return errorResponse(res, "PIN and Confirm PIN are required", 400);
    }
    if (pin !== confirmPin) {
      return errorResponse(res, "PIN and Confirm PIN do not match", 400);
    }
    if (pin.length < 4) {
      return errorResponse(res, "PIN must be at least 4 digits", 400);
    }

    // Call service to create wallet for user
    const wallet = await WalletService.createWallet(user_id, pin);
    return successResponse(res, "Wallet created successfully", { wallet });
  } catch (err) {
    return errorResponse(res, err, err.statusCode || 500);
  }
}

export async function addMoney(req, res) {
  try {
    const user_id = req.user.user_id;
    const { amount, pin } = req.body;

    if (!amount || amount <= 0) {
      return errorResponse(res, "Invalid amount", 400);
    }

    if (!pin) {
      return errorResponse(res, "Wallet PIN required", 400);
    }

    const result = await WalletService.initiateAddMoney(user_id, amount, pin);
    if (!result.success) {
      return errorResponse(res, result.message || "Failed to initiate add money", 400);
    }

    return successResponse(res, "Add money initiated", result);
  } catch (err) {
    return errorResponse(res, err, err.statusCode || 500);
  }
}

export async function verifyAddMoney(req, res) {
  try {
    const { txn_id, razorpay_payment_id } = req.body;
    if (!txn_id || !razorpay_payment_id) {
      return errorResponse(res, "txn_id and razorpay_payment_id required", 400);
    }
  const result = await WalletService.verifyAddMoney(txn_id, razorpay_payment_id);
    return successResponse(res, "Add money verification result", result);
  } catch (err) {
    return errorResponse(res, err, err.statusCode || 500);
  }
}

export async function withdraw(req, res) {
  try {
    const user_id = req.user.user_id;
    const { amount, pin } = req.body;

    if (!amount || amount <= 0) return errorResponse(res, "Invalid amount", 400);
    if (!pin) return errorResponse(res, "Wallet PIN required", 400);

    const result = await WalletService.initiateWithdraw(user_id, amount, pin);
    if (!result.success) {
      return errorResponse(res, result.message || "Withdrawal failed", 400);
    }

    return successResponse(res, "Withdrawal initiated", result);
  } catch (err) {
    return errorResponse(res, err, err.statusCode || 500);
  }
}

export async function viewBalance(req, res) {
  try {
    const user_id = req.user.user_id;
    const balance = await WalletService.getBalance(user_id);
    return successResponse(res, "Wallet balance fetched", { balance });
  } catch (err) {
    return errorResponse(res, err, err.statusCode || 500);
  }
}

export async function viewTransactions(req, res) {
  try {
    const user_id = req.user.user_id;
    const transactions = await WalletService.getTransactions(user_id);
    return successResponse(res, "Wallet transactions fetched", { transactions });
  } catch (err) {
    return errorResponse(res, err, err.statusCode || 500);
  }
}



export async function resetPinRequest(req, res) {
  try {
    const user_id = req.user.user_id;

    // Fetch user from UserRepository
    const user = await UserRepository.findById(user_id);
    if (!user || !user.email) {
      return errorResponse(res, "User email not found", 400);
    }

    // Send OTP email to user's email
    const otpResult = await sendEmailOTP(user.email);

    if (!otpResult.success) {
      return errorResponse(res, "Failed to send OTP email", 500);
    }

    return successResponse(res, "Authentication pending: OTP sent to email");
  } catch (err) {
    return errorResponse(res, err, err.statusCode || 500);
  }
}

export async function resetPinConfirm(req, res) {
  try {
    const userId = req.user?.user_id;
    const { otp, newPin } = req.body;

    if (!userId) {
      return errorResponse(res, "User ID not found in session", 401);
    }

    if (!otp || !newPin) {
      return errorResponse(res, "OTP and new PIN are required", 400);
    }

    // Fetch user email from DB
    const user = await UserRepository.findById(userId);
    if (!user || !user.email) {
      return errorResponse(res, "User email not found", 400);
    }
    const userEmail = user.email;

    // Verify OTP using user email
    const verification = verifyOTP(userEmail, otp);

    if (!verification.valid) {
      return errorResponse(res, verification.message, 400);
    }

    // Continue with PIN update logic...

    return successResponse(res, "PIN changed successfully");
  } catch (err) {
    return errorResponse(res, err.message || err, err.statusCode || 500);
  }
}
