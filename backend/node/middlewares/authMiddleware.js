import { verifyToken } from "../utils/jwtHelper.js";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    const decoded = verifyToken(token);
    req.user = decoded; // { user_id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || (roles.length && !roles.includes(req.user.role))) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};