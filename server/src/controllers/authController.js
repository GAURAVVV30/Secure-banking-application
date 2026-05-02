import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { createToken } from "../utils/token.js";
import { createSecurityEvent, createUserLog } from "../services/auditService.js";
import { isUnusualLoginTime } from "../services/ruleEngine.js";
import { sendSMS } from "../services/smsService.js";

const LOCK_MINUTES = 15;
const MAX_ATTEMPTS = 10;
const TEMP_FLAG_ATTEMPTS = 5;

export const register = async (req, res) => {
  try {
    const { fullName, email, password, phone, bankName } = req.body;
    if (!email || !password || !phone) {
      return res.status(400).json({ message: "Email, password and phone are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(phone).trim();

    if (!/^[^@\s]+@gmail\.com$/i.test(normalizedEmail)) {
      return res.status(400).json({ message: "Email must end with @gmail.com" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const normalizedName = fullName?.trim() || email.split("@")[0];
    const normalizedBankName = bankName?.trim() || "SBI";
    if (!normalizedBankName) {
      return res.status(400).json({ message: "Bank name is required" });
    }

    const user = await User.create({
      fullName: normalizedName,
      email: normalizedEmail,
      password: hashed,
      phone: normalizedPhone,
      bankName: normalizedBankName,
      role: "user"
    });

    await createUserLog({ user: user._id, action: "register", metadata: { email: user.email }, req });
    return res.status(201).json({ message: "User created", userId: user._id });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

export const completeProfile = async (req, res) => {
  try {
    const { userId, bankName, bankBranch, accountNumber, accountType, pin } = req.body;
    if (!userId || !bankName || !bankBranch || !accountNumber || !accountType || !pin) {
      return res.status(400).json({ message: "All account fields are required" });
    }

    if (!/^[A-Za-z\s]+$/.test(bankName)) {
      return res.status(400).json({ message: "Bank name must contain only letters" });
    }

    if (!/^[A-Za-z\s]+$/.test(bankBranch)) {
      return res.status(400).json({ message: "Bank branch must contain only letters" });
    }

    if (!/^\d{10}$/.test(String(accountNumber).trim())) {
      return res.status(400).json({ message: "Account number must be exactly 10 digits" });
    }

    if (!/^\d{4}$/.test(String(pin).trim())) {
      return res.status(400).json({ message: "PIN must be exactly 4 digits" });
    }

    const allowedTypes = ["savings", "current", "fixed_deposit", "recurring_deposit"];
    if (!allowedTypes.includes(accountType)) {
      return res.status(400).json({ message: "Invalid account type" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.accountNumber || user.pinHash) {
      return res.status(409).json({ message: "Account details already set" });
    }

    user.bankName = bankName.trim();
    user.bankBranch = bankBranch.trim();
    user.accountNumber = String(accountNumber).trim();
    user.accountType = accountType;
    user.pinHash = await bcrypt.hash(String(pin).trim(), 10);
    user.accountSetupAt = new Date();
    await user.save();

    await createUserLog({
      user: user._id,
      action: "complete_profile",
      metadata: { bankName: user.bankName, bankBranch: user.bankBranch, accountType },
      req
    });

    return res.json({ message: "Profile updated" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, adminPin } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(423).json({ message: "Account locked. Try again later." });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      user.loginAttempts += 1;
      user.failedLoginAttempts = user.loginAttempts;

      if (user.loginAttempts >= TEMP_FLAG_ATTEMPTS) {
        user.isTemporallyFlagged = true;
        user.statusFlag = "flagged";
      }

      await createSecurityEvent({
        user: user._id,
        type: "failed_login",
        details: `Failed login attempt ${user.loginAttempts}`,
        severity: "low"
      });

      if (user.loginAttempts >= MAX_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        user.lockUntil = lockUntil;
        user.isBlocked = true;
        user.statusFlag = "blocked";
        await createSecurityEvent({
          user: user._id,
          type: "account_lockout",
          details: "10 failed login attempts triggered 15 minute lockout",
          severity: "high"
        });
        await sendSMS(
          user.phone,
          "Security alert: your account has been temporarily locked for 15 minutes due to repeated failed login attempts."
        );
      }
      await user.save();
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const adminLoginPin = String(process.env.ADMIN_LOGIN_PIN || "5896547").trim();
    if (user.role === "admin" && normalizedEmail === adminEmail) {
      if (!/^\d{7}$/.test(String(adminPin || "").trim())) {
        return res.status(401).json({ message: "Admin PIN is required" });
      }
      if (String(adminPin).trim() !== adminLoginPin) {
        return res.status(401).json({ message: "Invalid admin PIN" });
      }
    }

    user.loginAttempts = 0;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.isTemporallyFlagged = false;
    user.isBlocked = false;
    user.lastLoginAt = new Date();
    user.statusFlag = "normal";

    if (isUnusualLoginTime(new Date())) {
      user.statusFlag = "flagged";
      await createSecurityEvent({
        user: user._id,
        type: "unusual_login_time",
        details: "Login occurred in unusual time window (23:00 - 06:00)",
        severity: "medium"
      });
    }

    await user.save();
    await createUserLog({ user: user._id, action: "login_success", metadata: { email }, req });

    const token = createToken(user._id, user.role);
    return res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        bankName: user.bankName,
        balance: user.balance,
        statusFlag: user.statusFlag
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email, pin, newPassword } = req.body;
    
    if (!email || !pin || !newPassword) {
      return res.status(400).json({ message: "Email, PIN, and new password are required" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.pinHash) {
      return res.status(400).json({ message: "Account setup is not complete. PIN is missing." });
    }

    const pinOk = await bcrypt.compare(String(pin).trim(), user.pinHash);
    if (!pinOk) {
      await createSecurityEvent({
        user: user._id,
        type: "failed_password_reset",
        details: "Failed forgot password attempt due to invalid PIN",
        severity: "low"
      });
      return res.status(403).json({ message: "Invalid PIN" });
    }

    user.password = await bcrypt.hash(String(newPassword), 10);
    user.loginAttempts = 0;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.isBlocked = false;
    user.isTemporallyFlagged = false;
    user.statusFlag = "normal";
    await user.save();

    await createUserLog({
      user: user._id,
      action: "password_reset",
      metadata: { method: "forgot_password_pin" },
      req
    });

    return res.json({ message: "Password reset successfully. You can now login." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
