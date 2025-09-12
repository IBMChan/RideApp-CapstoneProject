import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwtHelper.js";
import { findByEmail, createUser } from "../repositories/mysql/userRepository.js";

// Signup controller using repository pattern
export const signup = async (req, res) => {
  try {
    const { full_name, phone, email, role, password, license, gender, kyc_document } = req.body;

    // driver must provide license (basic check also in validator)
    if (role === "driver" && !license) {
      return res.status(400).json({ message: "License number is required for drivers" });
    }

    const existingUser = await findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await createUser({
      full_name,
      phone,
      email,
      role,
      license: role === "driver" ? license : null,
      password_hash,
      kyc_document ,
      gender: gender || null,
      
    });

    const token = signToken({ user_id: user.user_id, role: user.role });
    return res.status(201).json({
      message: "User created",
      token,
      user: { user_id: user.user_id, full_name: user.full_name, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Signup failed" });
  }
};

// Login controller using repository pattern
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // enforce license for driver accounts
    if (user.role === "driver" && !user.license) {
      return res.status(403).json({ message: "Driver account incomplete. License required." });
    }

    const token = signToken({ user_id: user.user_id, role: user.role });
    return res.json({
      message: "Login successful",
      token,
      user: { user_id: user.user_id, full_name: user.full_name, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Login failed" });
  }
};