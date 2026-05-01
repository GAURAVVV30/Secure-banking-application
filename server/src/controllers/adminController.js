import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Loan from "../models/Loan.js";
import SecurityEvent from "../models/SecurityEvent.js";
import UserLog from "../models/UserLog.js";

const deleteUserData = async (userId) => {
  await Transaction.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
  await Loan.deleteMany({ user: userId });
  await SecurityEvent.deleteMany({ user: userId });
  await UserLog.deleteMany({ user: userId });
};

export const getUsersByBank = async (req, res) => {
  const { bankName } = req.query;
  const query = bankName ? { bankName, role: { $ne: "admin" } } : { role: { $ne: "admin" } };
  const users = await User.find(query).select("-password").sort({ createdAt: -1 });
  return res.json(users);
};

export const getUserFullHistory = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });

  const transactions = await Transaction.find({
    $or: [{ sender: userId }, { receiver: userId }]
  })
    .populate("sender receiver", "email fullName bankName")
    .sort({ createdAt: -1 });

  const loans = await Loan.find({ user: userId }).sort({ createdAt: -1 });
  const securityEvents = await SecurityEvent.find({ user: userId }).sort({ createdAt: -1 });
  const logs = await UserLog.find({ user: userId }).sort({ createdAt: -1 });

  return res.json({ user, transactions, loans, securityEvents, logs });
};

export const getSecurityFeed = async (_req, res) => {
  const userFields = "email fullName bankName isBlocked isTemporallyFlagged statusFlag";
  const events = await SecurityEvent.find().populate("user", userFields).sort({ createdAt: -1 });
  const logs = await UserLog.find().populate("user", userFields).sort({ createdAt: -1 }).limit(200);
  return res.json({ events, logs });
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(400).json({ message: "Admin cannot be blocked" });

    user.isBlocked = true;
    user.statusFlag = "blocked";
    user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    return res.json({ message: "User blocked" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(400).json({ message: "Admin cannot be deleted" });

    await deleteUserData(user._id);
    await User.findByIdAndDelete(userId);
    return res.json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteBank = async (req, res) => {
  try {
    const { bankName } = req.params;
    const users = await User.find({ bankName, role: { $ne: "admin" } });
    if (!users.length) return res.status(404).json({ message: "Bank not found" });

    const userIds = users.map((user) => user._id);
    await Transaction.deleteMany({ $or: [{ sender: { $in: userIds } }, { receiver: { $in: userIds } }] });
    await Loan.deleteMany({ user: { $in: userIds } });
    await SecurityEvent.deleteMany({ user: { $in: userIds } });
    await UserLog.deleteMany({ user: { $in: userIds } });
    await User.deleteMany({ bankName, role: { $ne: "admin" } });

    return res.json({ message: `${bankName} deleted` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
