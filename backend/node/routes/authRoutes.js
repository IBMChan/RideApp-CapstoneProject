// backend/node/routes/authRoutes.js
import { Router } from "express";
import {
  login,
  initiateSignup,
  completeSignup,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import {
  validateLogin,
  validateSignup,
} from "../middlewares/validationMiddleware.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// ======================= Public Routes =======================

// Signup (2-step process)
// Add this to your route file
router.get("/me", authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

router.post("/signup/initiate", validateSignup, initiateSignup);
router.post("/signup/complete", completeSignup);

// Login / Logout
router.post("/login", validateLogin, login);
router.post("/logout", logout);

// Password reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ======================= Protected Routes =======================

// ✅ Used by frontend to check session validity (e.g., on page load)
router.get("/check", authMiddleware, (req, res) => {
  res.status(200).json({
    message: "Authenticated",
    user: req.user, // comes from decoded JWT
  });
});

export default router;
