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
    receiver: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: function () {
        return this.type === "transfer";
      } 
    },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["transfer", "credit", "purchase"], default: "transfer" },
    source: { type: String, enum: ["direct", "virtual_card"], default: "direct" },
    merchantName: { type: String, default: "" },
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
