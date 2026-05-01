import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Loan from "../models/Loan.js";
import Transaction from "../models/Transaction.js";
import { createSecurityEvent, createUserLog } from "../services/auditService.js";
import { isHugeTransfer } from "../services/ruleEngine.js";

export const getBalance = async (req, res) => {
  return res.json({ balance: req.user.balance });
};

export const transferFunds = async (req, res) => {
  try {
    const { receiverPhone, amount, pin } = req.body;
    const transferAmount = Number(amount);
    if (!transferAmount || transferAmount <= 0) {
      return res.status(400).json({ message: "Invalid transfer amount" });
    }

    if (!/^\d{4}$/.test(String(pin || ""))) {
      return res.status(400).json({ message: "PIN is required" });
    }

    const sender = await User.findById(req.user._id);
    if (!sender?.pinHash) {
      return res.status(400).json({ message: "PIN not set for this account" });
    }

    const pinOk = await bcrypt.compare(String(pin), sender.pinHash);
    if (!pinOk) {
      return res.status(403).json({ message: "Invalid PIN" });
    }
    if (!/^\d{10}$/.test(String(receiverPhone || "").trim())) {
      return res.status(400).json({ message: "Receiver phone must be 10 digits" });
    }

    const receiver = await User.findOne({ phone: String(receiverPhone).trim() });
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });

    if (req.pendingAdminApproval) {
      const transaction = await Transaction.create({
        sender: sender._id,
        receiver: receiver._id,
        amount: transferAmount,
        type: "transfer",
        status: "Pending Admin Approval",
        flagReason: req.pendingReason || "Pending review"
      });

      await createUserLog({
        user: sender._id,
        action: "transfer_pending_approval",
        metadata: {
          receiverPhone,
          amount: transferAmount,
          status: "Pending Admin Approval"
        },
        req
      });

      return res.status(202).json({
        message: "Transaction marked as Pending Admin Approval",
        transaction
      });
    }

    if (sender.balance < transferAmount) return res.status(400).json({ message: "Insufficient balance" });

    sender.balance -= transferAmount;
    receiver.balance += transferAmount;

    let status = "completed";
    let flagReason = "";
    if (isHugeTransfer(transferAmount)) {
      status = "flagged";
      flagReason = "Transfer amount exceeded huge transfer threshold";
      sender.statusFlag = "flagged";
      await createSecurityEvent({
        user: sender._id,
        type: "huge_transfer",
        details: `Huge transfer detected: ${transferAmount}`,
        severity: "high"
      });
    }

    await sender.save();
    await receiver.save();

    const transaction = await Transaction.create({
      sender: sender._id,
      receiver: receiver._id,
      amount: transferAmount,
      type: "transfer",
      status,
      flagReason
    });

    await createUserLog({
      user: sender._id,
      action: "transfer",
      metadata: { receiverPhone, amount: transferAmount, status },
      req
    });

    return res.status(201).json({ message: "Transfer successful", transaction });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const creditFunds = async (req, res) => {
  try {
    const { amount, pin } = req.body;
    const creditAmount = Number(amount);
    if (!creditAmount || creditAmount <= 0) {
      return res.status(400).json({ message: "Invalid credit amount" });
    }

    if (!/^\d{4}$/.test(String(pin || ""))) {
      return res.status(400).json({ message: "PIN is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user?.pinHash) {
      return res.status(400).json({ message: "PIN not set for this account" });
    }

    const pinOk = await bcrypt.compare(String(pin), user.pinHash);
    if (!pinOk) {
      return res.status(403).json({ message: "Invalid PIN" });
    }

    user.balance += creditAmount;
    await user.save();

    const transaction = await Transaction.create({
      receiver: user._id,
      amount: creditAmount,
      type: "credit",
      status: "completed"
    });

    await createUserLog({
      user: user._id,
      action: "credit",
      metadata: { amount: creditAmount },
      req
    });

    return res.status(201).json({ message: "Credit successful", transaction });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const transactions = await Transaction.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .populate("sender receiver", "email fullName bankName")
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({ transactions });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const validateLoanRules = (amount, months) => {
  if (!amount || amount <= 0) return "Invalid loan amount";
  if (amount < 50000) {
    if (![3, 6].includes(months)) return "Months must be 3 or 6 for loans below 50,000";
    return null;
  }
  if (amount >= 50000 && amount < 2000000) {
    if (![12, 36].includes(months)) return "Months must be 12 or 36 for this loan amount";
    return null;
  }
  return "Loan amount must be less than 2,000,000";
};

export const previewLoan = async (req, res) => {
  try {
    const { amount, months } = req.body;
    const loanAmount = Number(amount);
    const loanMonths = Number(months);
    const error = validateLoanRules(loanAmount, loanMonths);
    if (error) return res.status(400).json({ message: error });

    const monthlyPayment = Number((loanAmount / loanMonths).toFixed(2));
    return res.json({ amount: loanAmount, months: loanMonths, monthlyPayment });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const confirmLoan = async (req, res) => {
  try {
    const { amount, months, pin } = req.body;
    const loanAmount = Number(amount);
    const loanMonths = Number(months);
    const error = validateLoanRules(loanAmount, loanMonths);
    if (error) return res.status(400).json({ message: error });

    if (!/^\d{4}$/.test(String(pin || ""))) {
      return res.status(400).json({ message: "PIN is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user?.pinHash) {
      return res.status(400).json({ message: "PIN not set for this account" });
    }

    const pinOk = await bcrypt.compare(String(pin), user.pinHash);
    if (!pinOk) {
      return res.status(403).json({ message: "Invalid PIN" });
    }

    const monthlyPayment = Number((loanAmount / loanMonths).toFixed(2));
    const loan = await Loan.create({
      user: user._id,
      amount: loanAmount,
      months: loanMonths,
      monthlyPayment,
      status: "pending"
    });

    await createUserLog({
      user: user._id,
      action: "loan_applied",
      metadata: { amount: loanAmount, months: loanMonths, monthlyPayment },
      req
    });

    return res.status(201).json({ message: "Loan आवेदन received", loan });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
