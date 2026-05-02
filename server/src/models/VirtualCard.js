import mongoose from "mongoose";

const virtualCardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true // One card per user for now
    },
    cardNumber: { type: String, required: true, unique: true },
    cvv: { type: String, required: true },
    expiry: { type: String, required: true },
    status: { type: String, enum: ["active", "frozen"], default: "active" }
  },
  { timestamps: true }
);

export default mongoose.model("VirtualCard", virtualCardSchema);
