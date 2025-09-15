import jwt from 'jsonwebtoken';
import AdminService from '../services/adminService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

class AdminController {
  async adminLogin(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const adminUser = await AdminService.adminLogin(email, password);
      
      const token = jwt.sign(adminUser, process.env.JWT_SECRET, { expiresIn: '1d' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.json({ message: 'Admin login successful' });
    } catch (err) {
      console.error(err);
      return res.status(401).json({ message: err.message || 'Unauthorized' });
    }
  }

  async getAllUsers(req, res) {
    try {
      const users = await AdminService.fetchUsers();
      return successResponse(res, 'Users fetched successfully', users);
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to fetch users');
    }
  }

  async getAllPayments(req, res) {
    try {
      const payments = await AdminService.fetchPayments();
      return successResponse(res, 'Payments fetched successfully', payments);
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to fetch payments');
    }
  }

  async getAllWalletAccounts(req, res) {
    try {
      const wallets = await AdminService.fetchWalletAccounts();
      return successResponse(res, 'Wallet accounts fetched successfully', wallets);
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to fetch wallet accounts');
    }
  }

  async getAllWalletTransactions(req, res) {
    try {
      const transactions = await AdminService.fetchWalletTransactions();
      return successResponse(res, 'Wallet transactions fetched successfully', transactions);
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to fetch wallet transactions');
    }
  }

  async getAllVehicles(req, res) {
    try {
      const vehicles = await AdminService.fetchVehicles();
      return successResponse(res, 'Vehicles fetched successfully', vehicles);
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to fetch vehicles');
    }
  }
}

export default new AdminController();
