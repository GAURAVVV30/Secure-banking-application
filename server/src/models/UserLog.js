import mongoose from "mongoose";

const userLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    metadata: { type: Object, default: {} },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    deviceType: { type: String, default: "Unknown" },
    createdAt: { type: Date, default: Date.now }
  }
);

export default mongoose.model("UserLog", userLogSchema);
