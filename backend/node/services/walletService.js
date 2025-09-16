import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import WalletRepository from "../repositories/postgres/walletRepository.js";
import WalletTransactionRepository from "../repositories/postgres/walletTransactionRepository.js";
import AppError from "../utils/appError.js";

class WalletService {
  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    this.walletScript = process.env.PYTHON_WALLET_SCRIPT_PATH ||
      path.resolve(__dirname, "../../python/wallet/walletService.py");
    this.rideScript = path.resolve(__dirname, "../../python/rides/rideUtils.py");
  }

  runPython(scriptPath, args) {
    return new Promise((resolve, reject) => {
      const py = spawn("python", [`"${scriptPath}"`, ...args], { shell: true });
      let output = "", error = "";

      py.stdout.on("data", data => output += data.toString());
      py.stderr.on("data", data => error += data.toString());

      py.on("close", code => {
        if (code !== 0) return reject(new Error(error || `Python exited with code ${code}`));
        try { resolve(JSON.parse(output)); } catch { resolve(output.trim()); }
      });
    });
  }

  async createWallet(user_id, pin) {
    const existingWallet = await WalletRepository.findByUser(user_id);
    if (existingWallet) throw new AppError("Wallet already exists for user", 409);
    const wallet = await WalletRepository.createForUserWithPin(user_id, pin);
    if (!wallet) throw new AppError("Wallet creation failed", 500);
    return wallet;
  }

  async updatePin(user_id, newPin) {
    if (!newPin || newPin.length < 4) return { success: false, message: "PIN must be at least 4 digits" };
    const wallet = await WalletRepository.findByUser(user_id);
    if (!wallet) throw new AppError("Wallet not found", 404);

    const updatedWallet = await WalletRepository.updatePin(user_id, newPin);
    return { success: true, wallet: updatedWallet };
  }

  async getBalance(user_id) {
    const wallet = await WalletRepository.findByUser(user_id);
    if (!wallet) throw new AppError("Wallet not found", 404);
    return wallet.balance;
  }

  async getTransactions(user_id) {
    const wallet = await WalletRepository.findByUser(user_id);
    if (!wallet) throw new AppError("Wallet not found", 404);

    return WalletTransactionRepository.findByWallet(wallet.wallet_id);
  }

  async initiateWithdraw(user_id, amount, pin) {
    const wallet = await WalletRepository.findByUser(user_id);
    if (!wallet) throw new AppError('Wallet not found', 404);
    if (String(wallet.pin) !== String(pin)) return { success: false, message: 'Invalid wallet PIN' };
    if (parseFloat(wallet.balance) < parseFloat(amount)) return { success: false, message: 'Insufficient balance' };

    const result = await this.runPython(this.walletScript, ["withdraw", String(user_id), String(amount)]);
    if (!result.success) return { success: false, message: result.message || 'Withdrawal failed' };

    const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
    const updatedWallet = await WalletRepository.updateBalanceByUserId(user_id, newBalance);
    if (!updatedWallet) throw new AppError('Failed to update wallet balance', 500);

    await WalletTransactionRepository.create({
      wallet_id: wallet.wallet_id,
      debit: amount,
      type: 'debit',
      description: 'Withdrawal'
    });

    return { success: true, message: 'Withdrawal successful', balance: newBalance };
  }

  async initiateAddMoney(user_id, amount, pin) {
    const wallet = await WalletRepository.findByUser(user_id);
    if (!wallet) throw new AppError("Wallet not found", 404);
    if (String(wallet.pin) !== String(pin)) throw new AppError("Invalid wallet PIN", 401);

    const result = await this.runPython(this.walletScript, ["credit", String(user_id), String(amount)]);
    if (!result.success) throw new AppError(result.message || "Failed to add money", 500);
    return result;
  }

  async verifyAddMoney(txn_id, razorpay_payment_id) {
    const result = await this.runPython(this.walletScript, ["verify", String(txn_id), String(razorpay_payment_id)]);
    if (!result.success) throw new AppError(result.message || "Failed to verify add money payment", 400);
    return result;
  }
}

export default new WalletService();
