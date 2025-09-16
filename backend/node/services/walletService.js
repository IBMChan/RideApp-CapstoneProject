import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import WalletRepository from "../repositories/postgres/walletRepository.js";
import WalletTransactionRepository from "../repositories/postgres/walletTransactionRepository.js";
import AppError from "../utils/appError.js";
import walletServicePython from "./walletService.js"; // Python interop

class WalletService {
  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Environment variable path fallback to default Python wallet service script
    const envPath = process.env.PYTHON_WALLET_SCRIPT_PATH;
    if (envPath && path.isAbsolute(envPath) && envPath.endsWith(".py")) {
      this.walletScript = envPath;
    } else {
      this.walletScript = path.resolve(__dirname, "../../python/wallet/walletService.py");
    }

    this.rideScript = path.resolve(__dirname, "../../python/rides/rideUtils.py");

    console.log("Using python wallet script path:", this.walletScript);
    console.log("Using python ride script path:", this.rideScript);
  }

  runPython(scriptPath, args) {
    return new Promise((resolve, reject) => {
      const quotedScriptPath = `"${scriptPath}"`;
      const py = spawn("python", [quotedScriptPath, ...args], { shell: true });

      let output = "";
      let error = "";

      py.stdout.on("data", (data) => (output += data.toString()));
      py.stderr.on("data", (data) => (error += data.toString()));

      py.on("close", (code) => {
        if (code !== 0) {
          console.error("Python script failed:", error);
          return reject(new Error(error || `Python exited with code ${code}`));
        }
        try {
          resolve(JSON.parse(output));
        } catch {
          resolve(output.trim());
        }
      });
    });
  }

  async walletCredit(user_id, amount) {
    return this.runPython(this.walletScript, ["credit", String(user_id), String(amount)]);
  }

  async walletVerify(txn_id, razorpay_payment_id) {
    return this.runPython(this.walletScript, ["verify", String(txn_id), String(razorpay_payment_id)]);
  }

  async walletDebit(user_id, amount, ride_id = null) {
    const args = ["debit", String(user_id), String(amount)];
    if (ride_id) args.push(String(ride_id));
    return this.runPython(this.walletScript, args);
  }

  async walletWithdraw(user_id, amount) {
    return this.runPython(this.walletScript, ["withdraw", String(user_id), String(amount)]);
  }

  async createWallet(user_id, pin) {
    const existingWallet = await WalletRepository.findByUser(user_id);
    if (existingWallet) {
      throw new AppError("Wallet already exists for user", 409);
    }

    const wallet = await WalletRepository.createForUserWithPin(user_id, pin);
    if (!wallet) {
      throw new AppError("Wallet creation failed", 500);
    }
    return wallet;
  }

  async updatePin(user_id, newPin) {
    if (!newPin || newPin.length < 4) {
      return { success: false, message: "PIN must be at least 4 digits" };
    }

    // Find wallet by user ID
    const wallet = await WalletRepository.findByUser(user_id);
    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }

    // Update PIN in DB
    const updatedWallet = await WalletRepository.updatePin(user_id, newPin);
    return { success: true, wallet: updatedWallet };
  }


  async getTransactions(user_id) {
    const wallet = await WalletRepository.findByUser(user_id);
    if (!wallet) throw new AppError("Wallet not found", 404);

    const transactions = await WalletTransactionRepository.findByWallet(wallet.wallet_id);

    return transactions;
  }
async initiateWithdraw(user_id, amount, pin) {
  // Find wallet and verify PIN
  const wallet = await WalletRepository.findByUser(user_id);
  if (!wallet) {
    throw new AppError("Wallet not found", 404);
  }
  if (String(wallet.pin) !== String(pin)) {
    return { success: false, message: "Invalid wallet PIN" };
  }

  // Check balance
  if (wallet.balance < amount) {
    return { success: false, message: "Insufficient balance" };
  }

  // Call python service to withdraw amount
  const result = await this.walletWithdraw(user_id, amount);

  if (!result.success) {
    return { success: false, message: result.message || "Withdrawal failed" };
  }

  // Optional: update local DB wallet balance if needed here

  return { success: true, message: "Withdrawal successful", data: result };
}


  async initiateAddMoney(user_id, amount, pin) {
  // Validate pin and wallet existence
  const wallet = await WalletRepository.findByUser(user_id);
  if (!wallet) {
    throw new AppError("Wallet not found", 404);
  }
  if (String(wallet.pin) !== String(pin)) {
    throw new AppError("Invalid wallet PIN", 401);
  }

  // Call Python service to create razorpay order and pending txn
  const result = await walletServicePython.walletCredit(user_id, amount);

  if (!result.success) {
    throw new AppError(result.message || "Failed to create add money order", 500);
  }

  return result;
}

async verifyAddMoney(txn_id, razorpay_payment_id) {
  const result = await walletServicePython.walletVerify(txn_id, razorpay_payment_id);

  if (!result.success) {
    throw new AppError(result.message || "Failed to verify add money payment", 400);
  }
  return result;
}

  async getBalance(user_id) {
    const wallet = await WalletRepository.findByUser(user_id);
    if (!wallet) throw new AppError("Wallet not found", 404);
    return wallet.balance;
  }

  async callPython(method, params = {}) {
    return new Promise((resolve, reject) => {
      const py = spawn("python", [this.rideScript, method, JSON.stringify(params)], { shell: true });

      let output = "";
      let error = "";

      py.stdout.on("data", (data) => (output += data.toString()));
      py.stderr.on("data", (data) => (error += data.toString()));

      py.on("close", (code) => {
        if (code !== 0) {
          return reject(new Error(error || `Python exited with code ${code}`));
        }
        try {
          resolve(JSON.parse(output));
        } catch (e) {
          reject(new Error("Invalid Python output: " + output));
        }
      });
    });
  }
}

export default new WalletService();
