import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.type === "transfer";
      }
    },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["transfer", "credit"], default: "transfer" },
    status: {
      type: String,
      enum: ["completed", "flagged", "Pending Admin Approval"],
      default: "completed"
    },
    flagReason: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
