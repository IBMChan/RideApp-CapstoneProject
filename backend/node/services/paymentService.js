//payment(paypal)

import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
const execFileAsync = (file, args = []) =>
  new Promise((resolve, reject) => {
    execFile(file, args, {encoding: 'utf8'}, (err, stdout, stderr) => {
      if (err) return reject(err);
      try {
        const j = JSON.parse(stdout);
        return resolve(j);
      } catch (e) {
        return reject(new Error(`Invalid JSON from python: ${e.message} STDOUT:${stdout} STDERR:${stderr}`));
      }
    });
  });

const PY = process.env.PYTHON_PATH || 'python3';
const RAZORPY = path.resolve('python/payments/razorpay_integration.py');

/**
 * Create razorpay order via python
 * args: { amount: integer (paise), currency, receipt }
 */
export async function createRazorpayOrder({ amount, currency = 'INR', receipt }) {
  const payload = JSON.stringify({ action: 'create_order', amount, currency, receipt });
  // We'll pass payload as single argument
  const result = await execFileAsync(PY, [RAZORPY, payload]);
  if (!result.ok) throw new Error(result.error || 'failed to create order');
  return result.order;
}

/**
 * Verify payment signature via python
 * params: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export async function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const payload = JSON.stringify({ action: 'verify_signature', razorpay_order_id, razorpay_payment_id, razorpay_signature });
  const result = await execFileAsync(PY, [RAZORPY, payload]);
  return result.ok === true;
}

/**
 * capture payment
 */
export async function capturePayment({ payment_id, amount }) {
  const payload = JSON.stringify({ action: 'capture_payment', payment_id, amount });
  const result = await execFileAsync(PY, [RAZORPY, payload]);
  return result;
<<<<<<< HEAD
}
=======
}
>>>>>>> upstream/main
