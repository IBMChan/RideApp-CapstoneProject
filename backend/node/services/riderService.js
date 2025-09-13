//harshit and raksha // funcitonalities: 1. ride history 2. profile management(cloud image upload) 3. saved location (managing) 4. share status(twilio to whatsapp) 5. find a lost item/contact driver or previous rides/register a complaint
//chandana - wallet management 
//error handler

import { walletRepository } from '../repositories/postgres/walletRepositoy.js';
import { walletTransactionRepository } from '../repositories/postgres/walletTransactionRepository.js';
import { spawnPythonPayment } from '../config/razorpayConfig.js';

export const addMoneyService = async ({ user_id, amount, payment_method, bank_details }) => {
    // Call Python Razorpay script
    const paymentResult = await spawnPythonPayment({ action: 'create_order', amount, currency: 'INR', user_id, payment_method, bank_details });

    if (!paymentResult.success) {
        throw new Error('Payment failed');
    }

    // Update wallet balance
    const wallet = await walletRepository.getWalletByUserId(user_id);
    const newBalance = parseFloat(wallet.balance) + parseFloat(amount);

    await walletRepository.updateBalance(wallet.wallet_id, newBalance);

    // Log transaction
    await walletTransactionRepository.addTransaction(wallet.wallet_id, amount, null);

    return { success: true, newBalance };
};
