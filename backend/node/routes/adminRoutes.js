import { Router } from 'express';
import AdminController from '../controllers/adminController.js';

const router = Router();

// Admin login route (public)
router.post('/login', AdminController.adminLogin.bind(AdminController));

// All routes below this middleware need to verify admin token
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware.js';
router.use(adminAuthMiddleware);

// Protected admin routes example - to get data
router.get('/users', AdminController.getAllUsers.bind(AdminController));
router.get('/users/by-role', AdminController.getUsersByRole.bind(AdminController)); //get users by role

router.get('/payments', AdminController.getAllPayments.bind(AdminController));
router.get('/payments/by-mode', AdminController.getPaymentsByMode.bind(AdminController)); //get payments by mode

router.get('/wallet/accounts', AdminController.getAllWalletAccounts.bind(AdminController));
router.get('/wallet/transactions', AdminController.getAllWalletTransactions.bind(AdminController));
router.get('/vehicles', AdminController.getAllVehicles.bind(AdminController));


//rides data 

router.get("/rides", (req, res) => AdminController.getAllRides(req, res));
router.get("/rides/:ride_id", (req, res) => AdminController.getRide(req, res));
router.patch("/rides/:ride_id", (req, res) => AdminController.updateRide(req, res));
router.delete("/rides/:ride_id", (req, res) => AdminController.deleteRide(req, res));
router.get("/stats", (req, res) => AdminController.getStats(req, res));

export default router;
