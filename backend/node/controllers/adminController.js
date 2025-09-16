import jwt from 'jsonwebtoken';
import AdminService from '../services/adminService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

class AdminController {

  async getAllRides(req, res) {
    const rides = await AdminService.getAllRides();
    return res.json({ success: true, message: "All rides fetched", data: rides });
  }

  async getRide(req, res) {
    const { ride_id } = req.params;
    const ride = await AdminService.getRideById(ride_id);
    if (!ride) return res.status(404).json({ success: false, message: "Ride not found" });
    return res.json({ success: true, message: "Ride fetched", data: ride });
  }

  async updateRide(req, res) {
    const { ride_id } = req.params;
    const updates = req.body;
    const updated = await AdminService.updateRide(ride_id, updates);
    return res.json({ success: true, message: "Ride updated", data: updated });
  }

  async deleteRide(req, res) {
    const { ride_id } = req.params;
    await AdminService.deleteRide(ride_id);
    return res.json({ success: true, message: "Ride deleted" });
  }

  async getStats(req, res) {
    const stats = await AdminService.getStats();
    return res.json({ success: true, message: "Ride stats fetched", data: stats });
  }



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

  async getUsersByRole(req, res) {
    try {
      const role = req.query.role;
      if (!role || (role !== 'rider' && role !== 'driver')) {
        return res.status(400).json({ message: 'Role query parameter must be "rider" or "driver"' });
      }
      const users = await AdminService.findByRole(role);
      return successResponse(res, `Users with role ${role} fetched successfully`, users);
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to fetch users by role');
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

   async getPaymentsByMode(req, res) {
    try {
      const mode = req.query.mode;
      const validModes = ['wallet', 'cash', 'upi'];

      if (!validModes.includes(mode)) {
        return res.status(400).json({ message: `Invalid mode. Allowed modes: ${validModes.join(', ')}` });
      }

      const payments = await AdminService.fetchPaymentsByMode(mode);
      return successResponse(res, `Payments with mode ${mode} fetched successfully`, payments);
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to fetch payments by mode');
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
