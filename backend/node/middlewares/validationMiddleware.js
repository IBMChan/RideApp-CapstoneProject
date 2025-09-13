export const validateSignup = (req, res, next) => {
  const { full_name, phone, email, role, password, license } = req.body || {};

  if (!full_name || !phone || !email || !role || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!["driver", "rider", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  if (role === "driver" && !license) {
    return res.status(400).json({ message: "License number is required for drivers" });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  next();
};