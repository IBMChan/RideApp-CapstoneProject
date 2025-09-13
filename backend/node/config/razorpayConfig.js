import { spawn } from 'child_process';
import path from 'path';

const scriptPath = path.resolve("./python/payments/razorpay.py");

export const spawnPythonPayment = ({ action, amount, currency, user_id, payment_method, bank_details }) => {
    return new Promise((resolve, reject) => {
        const py = spawn('python', [scriptPath, JSON.stringify({ action, amount, currency, user_id, payment_method, bank_details })]);

        let output = '';
        py.stdout.on('data', (data) => {
            output += data.toString();
        });

        py.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        py.on('close', () => {
            try {
                const parsed = JSON.parse(output);
                resolve(parsed);
            } catch (err) {
                reject(err);
            }
        });
    });
};
