import userRepository from '../repositories/mysql/userRepository.js';
import paymentRepository from '../repositories/mongodb/paymentRepository.js';
import walletRepository from '../repositories/postgres/walletRepository.js';
import walletTransactionRepository from '../repositories/postgres/walletTransactionRepository.js';
import vehicleRepository from '../repositories/mysql/vehicleRepository.js';

class AdminService {
  async adminLogin(email, password) {
    // Replace this with secure method in prod, currently verify env vars directly
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      return { email, role: 'admin' };
    }
    throw new Error('Invalid admin credentials');
  }

  async fetchUsers() {
    return userRepository.findAll();
  }

  async fetchPayments() {
    return paymentRepository.findAll();
  }

  async fetchWalletAccounts() {
    return walletRepository.findAll();
  }

  async fetchWalletTransactions() {
    return walletTransactionRepository.findAll();
  }

  async fetchVehicles() {
    return vehicleRepository.findAll();
  }
}

export default new AdminService();
