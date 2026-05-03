import bcrypt from "bcryptjs";
import { query } from "../config/db.js";
import { createUserLog } from "../services/auditService.js";
import { mapUser } from "../utils/mapper.js";

export const getProfile = async (req, res) => {
  try {
    const result = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    const user = mapUser(result.rows[0]);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    delete user.password;
    delete user.pinHash;
    
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

    const existingResult = await query("SELECT id FROM users WHERE email = $1 AND id != $2", [normalizedEmail, req.user.id]);
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use by another account" });
    }

    await query("UPDATE users SET email = $1, phone = $2 WHERE id = $3", [normalizedEmail, normalizedPhone, req.user.id]);

    await createUserLog({
      user: req.user.id,
      action: "update_contact",
      metadata: { email: normalizedEmail, phone: normalizedPhone },
      req
    });

    return res.json({ message: "Contact information updated successfully", user: { email: normalizedEmail, phone: normalizedPhone } });
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

    const result = await query("SELECT password FROM users WHERE id = $1", [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(String(currentPassword), user.password);
    if (!ok) {
      return res.status(403).json({ message: "Incorrect current password" });
    }

    const hashed = await bcrypt.hash(String(newPassword), 10);
    await query("UPDATE users SET password = $1 WHERE id = $2", [hashed, req.user.id]);

    await createUserLog({
      user: req.user.id,
      action: "update_password",
      metadata: {},
      req
    });

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
