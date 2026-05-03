import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import { mapUser } from "../utils/mapper.js";

export const authRequired = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = decoded;
    
    const result = await query("SELECT * FROM users WHERE id = $1", [decoded.id]);
    const user = mapUser(result.rows[0]);
    
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    
    // Remove sensitive info from req.user
    const { password, pinHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.auth?.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  next();
};

export const requireRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.auth?.role || !allowedRoles.includes(req.auth.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
