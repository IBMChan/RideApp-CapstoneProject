import { Router } from 'express';
import AdminController from '../controllers/adminController.js';

const router = Router();

// Admin login route (public)
router.post('/login', AdminController.adminLogin.bind(AdminController));

// All routes below this middleware need to verify admin token
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware.js';
router.use(adminAuthMiddleware);

// Protected admin routes example
router.get('/users', AdminController.getAllUsers.bind(AdminController));
router.get('/payments', AdminController.getAllPayments.bind(AdminController));
router.get('/wallet/accounts', AdminController.getAllWalletAccounts.bind(AdminController));
router.get('/wallet/transactions', AdminController.getAllWalletTransactions.bind(AdminController));
router.get('/vehicles', AdminController.getAllVehicles.bind(AdminController));

export default router;
