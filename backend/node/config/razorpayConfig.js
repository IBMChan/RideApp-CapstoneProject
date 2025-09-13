import { spawn } from 'child_process';

export const spawnPythonPayment = ({ action, amount, currency, user_id, payment_method, bank_details }) => {
    return new Promise((resolve, reject) => {
        const py = spawn('python3', ['backend/python/razorpay.py', JSON.stringify({ action, amount, currency, user_id, payment_method, bank_details })]);

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
