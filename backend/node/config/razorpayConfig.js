import { spawn } from "child_process";
import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Node.js Razorpay instance (default)
export default razorpay;

// Python wrapper (named export)
export const spawnPythonPayment = (params) => {
  return new Promise((resolve, reject) => {
    const python = spawn("python", ["./backend/python/wallet/wallet_service.py", JSON.stringify(params)]);

    let output = "";
    python.stdout.on("data", (data) => (output += data.toString()));
    python.stderr.on("data", (err) => console.error("Python error:", err.toString()));
    python.on("close", () => {
      try {
        resolve(JSON.parse(output));
      } catch (e) {
        reject(e);
      }
    });
  });
};
