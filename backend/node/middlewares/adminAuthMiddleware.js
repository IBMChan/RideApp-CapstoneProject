import jwt from 'jsonwebtoken';

export function adminAuthMiddleware(req, res, next) {
  const token = req.cookies.token;  // Requires cookie-parser middleware
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admin access denied' });
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

