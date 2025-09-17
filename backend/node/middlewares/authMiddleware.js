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
      user_id: decoded.id || decoded.user_id,
      role: decoded.role,
    };

    if (!req.user.user_id) {
      return res.status(400).json({ success: false, message: "User ID missing in token" });
    }

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// raksha and harshit
// export const authMiddleware = (req, res, next) => {
//   try {
//     let token = null;

//     if (req.cookies?.token) {
//       token = req.cookies.token;
//     } else if (req.headers.authorization?.startsWith("Bearer ")) {
//       token = req.headers.authorization.split(" ")[1];
//     }

//     if (!token) return res.status(401).json({ message: "Unauthorized" });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     console.error("Auth error:", err);
//     return res.status(401).json({ message: "Unauthorized" });
//   }
// };