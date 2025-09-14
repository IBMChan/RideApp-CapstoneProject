import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

class PythonService {
  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const envPath = process.env.PYTHON_WALLET_SCRIPT_PATH;
    if (envPath && path.isAbsolute(envPath) && envPath.endsWith(".py")) {
      this.walletScript = envPath;
    } else {
      this.walletScript = path.resolve(__dirname, "../../python/wallet/wallet_service.py");
    }

    this.rideScript = path.resolve(__dirname, "../../python/rides/rideUtils.py");

    console.log("Using python wallet script:", this.walletScript);
    console.log("Using python ride script:", this.rideScript);
  }

  runPython(scriptPath, args) {
    return new Promise((resolve, reject) => {
      const py = spawn("python", [scriptPath, ...args], { shell: true });

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

export default new PythonService();
