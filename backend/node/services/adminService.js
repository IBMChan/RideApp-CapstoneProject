import userRepository from '../repositories/mysql/userRepository.js';
import paymentRepository from '../repositories/mongodb/paymentRepository.js';
import walletRepository from '../repositories/postgres/walletRepository.js';
import walletTransactionRepository from '../repositories/postgres/walletTransactionRepository.js';
import vehicleRepository from '../repositories/mysql/vehicleRepository.js';
import ridesRepository from '../repositories/mysql/ridesRepository.js';

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


  async getAllRides() {
    return await ridesRepository.getAll();
  }

  async getRideById(ride_id) {
    return await ridesRepository.findById(ride_id);
  }

  async findByRole(role){
    return await userRepository.findByRole(role)
  }
  async updateRide(ride_id, updates) {
    return await ridesRepository.updateRide(ride_id, updates);
  }

  async deleteRide(ride_id) {
    return await ridesRepository.deleteRide(ride_id);
  }

  async getStats() {
    const rides = await ridesRepository.getAll();
    const total = rides.length;
    const completed = rides.filter(r => r.status === "completed").length;
    const cancelled = rides.filter(r => r.status === "cancelled").length;
    const ongoing = rides.filter(r => ["requested", "accepted", "in_progress"].includes(r.status)).length;

    return { total, completed, cancelled, ongoing };
  }



  async fetchUsers() {
    return userRepository.findAll();
  }
  
  // Raksha & Harshit
  async fetchRides() {
    return ridesRepository.getAllRides();
  }

  async fetchPayments() {
    return paymentRepository.findAll();
  }

   async fetchPaymentsByMode(mode) {
    return paymentRepository.findByMode(mode);
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
