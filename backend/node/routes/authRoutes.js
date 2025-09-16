import { Router } from "express";
import { login, initiateSignup, completeSignup, logout, forgotPassword, resetPassword } from "../controllers/authController.js";
import { validateLogin, validateSignup } from "../middlewares/validationMiddleware.js";

const router = Router();

router.post("/signup/initiate", validateSignup, initiateSignup);
router.post("/signup/complete", completeSignup);
router.post("/login", validateLogin, login);

router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;