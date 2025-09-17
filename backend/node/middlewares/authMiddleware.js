// authMiddleware.js
// middlewares/authMiddleware.js
// import jwt from "jsonwebtoken";

// export const authMiddleware = (req, res, next) => {
//   try {
//     const token = req.cookies?.token; // ✅ cookie-based auth
//     if (!token) return res.status(401).json({ message: "Unauthorized: token missing" });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     console.error("Auth error:", err);
//     return res.status(401).json({ message: "Unauthorized: authMiddleware Error" });
//   }
// };

import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Handle both "id" and "user_id" just in case
    req.user = {
      id: decoded.id || decoded.user_id,
      role: decoded.role,
    };

    if (!req.user.id) {
      return res.status(400).json({ success: false, message: "User ID missing in token" });
    }

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
