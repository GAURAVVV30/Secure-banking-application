import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authRequired = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = decoded;
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    req.user = user;
    next();
  } catch {
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
