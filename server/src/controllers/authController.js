import bcrypt from "bcryptjs";
import { query } from "../config/db.js";
import { createToken } from "../utils/token.js";
import { createSecurityEvent, createUserLog } from "../services/auditService.js";
import { isUnusualLoginTime } from "../services/ruleEngine.js";
import { sendSMS } from "../services/smsService.js";
import { mapUser } from "../utils/mapper.js";

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

    const existsResult = await query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existsResult.rows.length > 0) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const normalizedName = fullName?.trim() || email.split("@")[0];
    const normalizedBankName = bankName?.trim() || "SBI";
    if (!normalizedBankName) {
      return res.status(400).json({ message: "Bank name is required" });
    }

    const result = await query(
      "INSERT INTO users (full_name, email, password, phone, bank_name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [normalizedName, normalizedEmail, hashed, normalizedPhone, normalizedBankName, "user"]
    );
    const user = mapUser(result.rows[0]);

    await createUserLog({ user: user.id, action: "register", metadata: { email: user.email }, req });
    return res.status(201).json({ message: "User created", userId: user.id });
  } catch (error) {
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

    const result = await query("SELECT * FROM users WHERE id = $1", [userId]);
    const user = mapUser(result.rows[0]);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.accountNumber || user.pinHash) {
      return res.status(409).json({ message: "Account details already set" });
    }

    const hashedPin = await bcrypt.hash(String(pin).trim(), 10);
    await query(
      "UPDATE users SET bank_name = $1, bank_branch = $2, account_number = $3, account_type = $4, pin_hash = $5, account_setup_at = NOW() WHERE id = $6",
      [bankName.trim(), bankBranch.trim(), String(accountNumber).trim(), accountType, hashedPin, userId]
    );

    await createUserLog({
      user: userId,
      action: "complete_profile",
      metadata: { bankName: bankName.trim(), bankBranch: bankBranch.trim(), accountType },
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
    
    const result = await query("SELECT * FROM users WHERE email = $1", [normalizedEmail]);
    let user = mapUser(result.rows[0]);
    
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(423).json({ message: "Account locked. Try again later." });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      user.loginAttempts += 1;
      user.failedLoginAttempts = user.loginAttempts;

      let updates = "login_attempts = login_attempts + 1, failed_login_attempts = failed_login_attempts + 1";
      
      if (user.loginAttempts >= TEMP_FLAG_ATTEMPTS) {
        updates += ", is_temporally_flagged = true, status_flag = 'flagged'";
      }

      await createSecurityEvent({
        user: user.id,
        type: "failed_login",
        details: `Failed login attempt ${user.loginAttempts}`,
        severity: "low"
      });

      if (user.loginAttempts >= MAX_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        updates += `, lock_until = $2, is_blocked = true, status_flag = 'blocked'`;
        await createSecurityEvent({
          user: user.id,
          type: "account_lockout",
          details: "10 failed login attempts triggered 15 minute lockout",
          severity: "high"
        });
        await sendSMS(
          user.phone,
          "Security alert: your account has been temporarily locked for 15 minutes due to repeated failed login attempts."
        );
        await query(`UPDATE users SET ${updates} WHERE id = $1`, [user.id, lockUntil]);
      } else {
        await query(`UPDATE users SET ${updates} WHERE id = $1`, [user.id]);
      }
      
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

    let statusFlag = "normal";
    if (isUnusualLoginTime(new Date())) {
      statusFlag = "flagged";
      await createSecurityEvent({
        user: user.id,
        type: "unusual_login_time",
        details: "Login occurred in unusual time window (23:00 - 06:00)",
        severity: "medium"
      });
    }

    await query(
      "UPDATE users SET login_attempts = 0, failed_login_attempts = 0, lock_until = NULL, is_temporally_flagged = false, is_blocked = false, last_login_at = NOW(), status_flag = $2 WHERE id = $1",
      [user.id, statusFlag]
    );

    await createUserLog({ user: user.id, action: "login_success", metadata: { email }, req });

    const token = createToken(user.id, user.role);
    return res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        bankName: user.bankName,
        balance: user.balance,
        statusFlag: statusFlag
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
    const result = await query("SELECT * FROM users WHERE email = $1", [normalizedEmail]);
    const user = mapUser(result.rows[0]);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.pinHash) {
      return res.status(400).json({ message: "Account setup is not complete. PIN is missing." });
    }

    const pinOk = await bcrypt.compare(String(pin).trim(), user.pinHash);
    if (!pinOk) {
      await createSecurityEvent({
        user: user.id,
        type: "failed_password_reset",
        details: "Failed forgot password attempt due to invalid PIN",
        severity: "low"
      });
      return res.status(403).json({ message: "Invalid PIN" });
    }

    const hashedPass = await bcrypt.hash(String(newPassword), 10);
    await query(
      "UPDATE users SET password = $1, login_attempts = 0, failed_login_attempts = 0, lock_until = NULL, is_blocked = false, is_temporally_flagged = false, status_flag = 'normal' WHERE id = $2",
      [hashedPass, user.id]
    );

    await createUserLog({
      user: user.id,
      action: "password_reset",
      metadata: { method: "forgot_password_pin" },
      req
    });

    return res.json({ message: "Password reset successfully. You can now login." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
