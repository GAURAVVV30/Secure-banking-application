import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    bankName: {
      type: String,
      required: function () {
        return this.role !== "admin";
      }
    },
    bankBranch: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    accountType: {
      type: String,
      enum: ["savings", "current", "fixed_deposit", "recurring_deposit", ""],
      default: ""
    },
    pinHash: { type: String, default: "" },
    accountSetupAt: { type: Date, default: null },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    balance: { type: Number, default: 0 },
    loginAttempts: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    isTemporallyFlagged: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    statusFlag: { type: String, enum: ["normal", "flagged", "blocked"], default: "normal" },
    lastLoginAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
