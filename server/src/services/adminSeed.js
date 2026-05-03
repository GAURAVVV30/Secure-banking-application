import bcrypt from "bcryptjs";
import { query } from "../config/db.js";

const DEFAULT_ADMIN_EMAIL = "chaos@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "7894561230";

export const ensureAdminUser = async () => {
  const email = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

  const result = await query("SELECT * FROM users WHERE email = $1", [email]);
  const existing = result.rows[0];

  if (existing) {
    await query(
      "UPDATE users SET bank_name = '', bank_branch = '', account_number = '', account_type = '', pin_hash = '', account_setup_at = NULL, role = 'admin' WHERE id = $1",
      [existing.id]
    );
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  await query(
    "INSERT INTO users (full_name, email, password, phone, bank_name, bank_branch, account_number, account_type, role, balance, status_flag) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
    ["System Admin", email, hashed, "0000000000", "", "", "", "", "admin", 0, "normal"]
  );
};
