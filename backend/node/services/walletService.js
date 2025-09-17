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

  async getWalletByUserId(user_id) {
    return await WalletRepository.findByUser(user_id) || null;
  }

  async initiateAddMoney(user_id, amount, pin) {
    const wallet = await WalletRepository.findByUser(user_id);
    if (!wallet) throw new AppError("Wallet not found", 404);
    if (String(wallet.pin) !== String(pin)) throw new AppError("Invalid wallet PIN", 401);

    // call python to create credit txn and razorpay order
    const result = await this.runPython(this.walletScript, ["credit", String(user_id), String(amount)]);
    if (!result.success) throw new AppError(result.message || "Failed to initiate add money", 500);

    const txn = result.txn; // transaction returned from Python
    // ensure we save txn in Node-side if needed (or return to frontend)
    return { success: true, message: "Add money initiated", txn };
  }

  async verifyAddMoneyByTxnId(razorpay_payment_id) {
    if (!razorpay_payment_id) throw new AppError("razorpay_payment_id is required", 400);

    // Fetch txn by razorpay_payment_id
    const txn = await WalletTransactionRepository.findByRazorpayId(razorpay_payment_id);
    if (!txn) return { success: false, message: "Transaction not found" };
    if (txn.status === "completed") return { success: true, message: "Already verified" };

    // Update wallet balance
    const wallet = await WalletRepository.findById(txn.wallet_id);
    if (!wallet) throw new AppError("Wallet not found", 404);

    const newBalance = parseFloat(wallet.balance) + parseFloat(txn.credit || 0);
    await WalletRepository.updateBalance(wallet.wallet_id, newBalance);

    // Update transaction status
    await WalletTransactionRepository.updateStatus(txn.transc_id, "completed");

    return { success: true, message: "Wallet credited", balance: newBalance };
  }

  async initiateWithdraw(user_id, amount, pin) {
    const wallet = await WalletRepository.findByUser(user_id);
    if (!wallet) throw new AppError("Wallet not found", 404);
    if (String(wallet.pin) !== String(pin)) throw new AppError("Invalid wallet PIN", 401);
    if (parseFloat(wallet.balance) < parseFloat(amount)) throw new AppError("Insufficient balance", 400);

    const result = await this.runPython(this.walletScript, ["withdraw", String(user_id), String(amount)]);
    if (!result.success) throw new AppError(result.message || "Withdrawal failed", 500);

    const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
    await WalletRepository.updateBalance(wallet.wallet_id, newBalance);

    // Record debit txn
    await WalletTransactionRepository.create({
      wallet_id: wallet.wallet_id,
      debit: amount,
      status: "pending"
    });

    return { success: true, message: "Withdrawal initiated", balance: newBalance };
  }

  async getBalance(user_id) {
    const wallet = await WalletRepository.findByUser(user_id);
    if (!wallet) throw new AppError("Wallet not found", 404);
    return wallet.balance;
  }

  async getTransactions(user_id) {
    const wallet = await WalletRepository.findByUser(user_id);
    if (!wallet) throw new AppError("Wallet not found", 404);

    const txns = await WalletTransactionRepository.findByWallet(wallet.wallet_id);

    return txns.map(t => ({
      transc_id: t.transc_id,
      txn_date: t.txn_date,
      credit: t.credit,
      debit: t.debit,
      status: t.status,
      razorpay_payment_id: t.razorpay_payment_id
    }));
  }
}

export default new WalletService();
