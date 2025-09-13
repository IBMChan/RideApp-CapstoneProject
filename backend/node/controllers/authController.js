import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwtHelper.js";
import { findByEmail, createUser, updatePasswordByEmail } from "../repositories/mysql/userRepository.js";
import { sendEmailOTP, sendSmsOTP, verifyOTP } from "../services/notificationService.js";

const pendingUsers = new Map();
const resetSessions = new Map(); // email -> { expiresAt, otp }

export const initiateSignup = async (req, res) => {
  try {
    const { full_name, phone, email, role, password, license, gender,kyc_type, kyc_document } = req.body;
    if (role === "driver" && !license) return res.status(400).json({ message: "License number is required for drivers" });
    if (!full_name || !email || !phone || !role || !password) return res.status(400).json({ message: "Missing required fields" });
    if (await findByEmail(email)) return res.status(409).json({ message: "Email already in use" });

    const password_hash = await bcrypt.hash(password, 10);
    const pendingId = `${email}:${Date.now()}`;
    pendingUsers.set(pendingId, { full_name, phone, email, role, license: role === "driver" ? license : null, password_hash,kyc_type, kyc_document, gender });

    const emailOtp = await sendEmailOTP(email);
    const phoneOtp = await sendSmsOTP(phone, email);

    res.json({ message: "OTP sent to email (both copies for demo)", pendingId, emailOtp: emailOtp.otp, phoneOtp: phoneOtp.otp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to initiate signup" });
  }
};

export const completeSignup = async (req, res) => {
  try {
    const { pendingId, emailOtp, phoneOtp } = req.body;
    const pendingUser = pendingUsers.get(pendingId);
    if (!pendingUser) return res.status(400).json({ message: "Invalid or expired signup session" });

    const emailCheck = verifyOTP(pendingUser.email, emailOtp);
    if (!emailCheck.valid) return res.status(401).json({ message: "Invalid or expired email OTP" });
    const phoneCheck = verifyOTP(pendingUser.phone, phoneOtp);
    if (!phoneCheck.valid) return res.status(401).json({ message: "Invalid or expired phone OTP" });

    const user = await createUser({ ...pendingUser, emailVerified: true, phoneVerified: true });
    pendingUsers.delete(pendingId);

    const userId = user.user_id ?? user.id;
    const token = signToken({ user_id: userId, role: user.role });
    res.status(201).json({ message: "Signup complete", token, user: { user_id: userId, full_name: user.full_name, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (!user.emailVerified || !user.phoneVerified) return res.status(403).json({ message: "Email or phone not verified" });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    if (user.role === "driver" && !user.license) return res.status(403).json({ message: "Driver account incomplete. License required." });
    const userId = user.user_id ?? user.id;
    const token = signToken({ user_id: userId, role: user.role });
    res.json({ message: "Login successful", token, user: { user_id: userId, full_name: user.full_name, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};

// Stateless JWT logout: client should discard token. For demo, just respond OK.
export const logout = async (_req, res) => {
  return res.json({ message: "Logged out" });
};

// Forgot password: send OTP to email for verification
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await findByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    const emailOtp = await sendEmailOTP(email);
    // store a short-lived reset session bound to email via internal OTP store
    // (verify will check against store)
    return res.json({ message: "Password reset OTP sent to email", emailOtp: emailOtp.otp });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to initiate password reset" });
  }
};

// Reset password using OTP
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ message: "Missing fields" });

    const check = verifyOTP(email, otp);
    if (!check.valid) return res.status(401).json({ message: check.message || "Invalid or expired OTP" });

    const password_hash = await bcrypt.hash(newPassword, 10);
    const user = await updatePasswordByEmail(email, password_hash);
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to reset password" });
  }
};