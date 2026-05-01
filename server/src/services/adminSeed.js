import bcrypt from "bcryptjs";
import User from "../models/User.js";

const DEFAULT_ADMIN_EMAIL = "chaos@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "7894561230";

export const ensureAdminUser = async () => {
  const email = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

  const existing = await User.findOne({ email });
  if (existing) {
    existing.bankName = "";
    existing.bankBranch = "";
    existing.accountNumber = "";
    existing.accountType = "";
    existing.pinHash = "";
    existing.accountSetupAt = null;
    existing.role = "admin";
    await existing.save();
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    fullName: "System Admin",
    email,
    password: hashed,
    phone: "0000000000",
    bankName: "",
    bankBranch: "",
    accountNumber: "",
    accountType: "",
    role: "admin",
    balance: 0,
    statusFlag: "normal"
  });
};
