import mongoose from "mongoose";

const securityEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["unusual_login_time", "huge_transfer", "account_lockout", "failed_login"],
      required: true
    },
    details: { type: String, required: true },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" }
  },
  { timestamps: true }
);

export default mongoose.model("SecurityEvent", securityEventSchema);
