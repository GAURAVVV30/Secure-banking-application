import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { createUserLog } from "../services/auditService.js";

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -pinHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateContact = async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    if (!email || !phone) {
      return res.status(400).json({ message: "Email and phone are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(phone).trim();

    if (!/^[^@\s]+@gmail\.com$/i.test(normalizedEmail)) {
      return res.status(400).json({ message: "Email must end with @gmail.com" });
    }

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user._id } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use by another account" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.email = normalizedEmail;
    user.phone = normalizedPhone;
    await user.save();

    await createUserLog({
      user: user._id,
      action: "update_contact",
      metadata: { email: user.email, phone: user.phone },
      req
    });

    return res.json({ message: "Contact information updated successfully", user: { email: user.email, phone: user.phone } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(String(currentPassword), user.password);
    if (!ok) {
      return res.status(403).json({ message: "Incorrect current password" });
    }

    user.password = await bcrypt.hash(String(newPassword), 10);
    await user.save();

    await createUserLog({
      user: user._id,
      action: "update_password",
      metadata: {},
      req
    });

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
