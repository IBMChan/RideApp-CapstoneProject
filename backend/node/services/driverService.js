// shriya : profile managemnet, ride history, payment history, vahicle management, dr_status management(online, offline) , register a complaint  
//chandana - wallet management
import { walletRepository } from '../repositories/postgres/walletRepositoy.js';
import { walletTransactionRepository } from '../repositories/postgres/walletTransactionRepository.js';
import { spawnPythonPayment } from '../config/razorpayConfig.js';

export const withdrawMoneyService = async ({ user_id, amount, payment_method, bank_details }) => {
    const wallet = await walletRepository.getWalletByUserId(user_id);

    if (parseFloat(wallet.balance) < parseFloat(amount)) {
        throw new Error('Insufficient balance');
    }

    // Call Python Razorpay script for payout
    const payoutResult = await spawnPythonPayment({ action: 'payout', amount, currency: 'INR', user_id, payment_method, bank_details });

    if (!payoutResult.success) {
        throw new Error('Payout failed');
    }

    const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
    await walletRepository.updateBalance(wallet.wallet_id, newBalance);

    // Log transaction
    await walletTransactionRepository.addTransaction(wallet.wallet_id, null, amount);

    return { success: true, newBalance };
<<<<<<< HEAD
};
=======
};
>>>>>>> upstream/main
