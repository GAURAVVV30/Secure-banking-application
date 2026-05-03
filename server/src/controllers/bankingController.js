import bcrypt from "bcryptjs";
import { getClient, query } from "../config/db.js";
import { createSecurityEvent, createUserLog } from "../services/auditService.js";
import { isHugeTransfer } from "../services/ruleEngine.js";
import { mapUser, mapTransaction, mapVirtualCard, mapLoan } from "../utils/mapper.js";

export const getBalance = async (req, res) => {
  try {
    const result = await query("SELECT balance FROM users WHERE id = $1", [req.user.id]);
    return res.json({ balance: parseFloat(result.rows[0].balance) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const transferFunds = async (req, res) => {
  const client = await getClient();
  try {
    const { receiverPhone, amount, pin } = req.body;
    const transferAmount = Number(amount);
    if (!transferAmount || transferAmount <= 0) {
      return res.status(400).json({ message: "Invalid transfer amount" });
    }

    if (!/^\d{4}$/.test(String(pin || ""))) {
      return res.status(400).json({ message: "PIN is required" });
    }

    const senderResult = await client.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    const sender = mapUser(senderResult.rows[0]);
    
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

    const receiverResult = await client.query("SELECT * FROM users WHERE phone = $1", [String(receiverPhone).trim()]);
    const receiver = mapUser(receiverResult.rows[0]);
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });

    if (req.pendingAdminApproval) {
      const transResult = await client.query(
        "INSERT INTO transactions (sender_id, receiver_id, amount, type, status, flag_reason) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [sender.id, receiver.id, transferAmount, "transfer", "Pending Admin Approval", req.pendingReason || "Pending review"]
      );
      const transaction = mapTransaction(transResult.rows[0]);

      await createUserLog({
        user: sender.id,
        action: "transfer_pending_approval",
        metadata: { receiverPhone, amount: transferAmount, status: "Pending Admin Approval" },
        req
      });

      return res.status(202).json({ message: "Transaction marked as Pending Admin Approval", transaction });
    }

    if (sender.balance < transferAmount) return res.status(400).json({ message: "Insufficient balance" });

    await client.query("BEGIN");

    await client.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [transferAmount, sender.id]);
    await client.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [transferAmount, receiver.id]);

    let status = "completed";
    let flagReason = "";
    if (isHugeTransfer(transferAmount)) {
      status = "flagged";
      flagReason = "Transfer amount exceeded huge transfer threshold";
      await client.query("UPDATE users SET status_flag = 'flagged' WHERE id = $1", [sender.id]);
      await createSecurityEvent({
        user: sender.id,
        type: "huge_transfer",
        details: `Huge transfer detected: ${transferAmount}`,
        severity: "high"
      });
    }

    const transResult = await client.query(
      "INSERT INTO transactions (sender_id, receiver_id, amount, type, status, flag_reason) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [sender.id, receiver.id, transferAmount, "transfer", status, flagReason]
    );
    const transaction = mapTransaction(transResult.rows[0]);

    await client.query("COMMIT");

    await createUserLog({
      user: sender.id,
      action: "transfer",
      metadata: { receiverPhone, amount: transferAmount, status },
      req
    });

    return res.status(201).json({ message: "Transfer successful", transaction });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

export const creditFunds = async (req, res) => {
  const client = await getClient();
  try {
    const { amount, pin } = req.body;
    const creditAmount = Number(amount);
    if (!creditAmount || creditAmount <= 0) {
      return res.status(400).json({ message: "Invalid credit amount" });
    }

    if (!/^\d{4}$/.test(String(pin || ""))) {
      return res.status(400).json({ message: "PIN is required" });
    }

    const userResult = await client.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    const user = mapUser(userResult.rows[0]);
    if (!user?.pinHash) {
      return res.status(400).json({ message: "PIN not set for this account" });
    }

    const pinOk = await bcrypt.compare(String(pin), user.pinHash);
    if (!pinOk) {
      return res.status(403).json({ message: "Invalid PIN" });
    }

    await client.query("BEGIN");
    await client.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [creditAmount, user.id]);

    const transResult = await client.query(
      "INSERT INTO transactions (receiver_id, amount, type, status) VALUES ($1, $2, $3, $4) RETURNING *",
      [user.id, creditAmount, "credit", "completed"]
    );
    const transaction = mapTransaction(transResult.rows[0]);
    await client.query("COMMIT");

    await createUserLog({
      user: user.id,
      action: "credit",
      metadata: { amount: creditAmount },
      req
    });

    return res.status(201).json({ message: "Credit successful", transaction });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

export const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT t.*, 
              s.email as sender_email, s.full_name as sender_name, s.bank_name as sender_bank,
              r.email as receiver_email, r.full_name as receiver_name, r.bank_name as receiver_bank
       FROM transactions t
       LEFT JOIN users s ON t.sender_id = s.id
       LEFT JOIN users r ON t.receiver_id = r.id
       WHERE t.sender_id = $1 OR t.receiver_id = $1
       ORDER BY t.created_at DESC LIMIT 200`,
      [userId]
    );

    const transactions = result.rows.map(t => ({
      ...mapTransaction(t),
      sender: t.sender_id ? { _id: t.sender_id, id: t.sender_id, email: t.sender_email, fullName: t.sender_name, bankName: t.sender_bank } : null,
      receiver: t.receiver_id ? { _id: t.receiver_id, id: t.receiver_id, email: t.receiver_email, fullName: t.receiver_name, bankName: t.receiver_bank } : null
    }));


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

    const userResult = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    const user = mapUser(userResult.rows[0]);
    if (!user?.pinHash) {
      return res.status(400).json({ message: "PIN not set for this account" });
    }

    const pinOk = await bcrypt.compare(String(pin), user.pinHash);
    if (!pinOk) {
      return res.status(403).json({ message: "Invalid PIN" });
    }

    const monthlyPayment = Number((loanAmount / loanMonths).toFixed(2));
    const result = await query(
      "INSERT INTO loans (user_id, amount, months, monthly_payment, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [user.id, loanAmount, loanMonths, monthlyPayment, "pending"]
    );
    const loan = mapLoan(result.rows[0]);

    await createUserLog({
      user: user.id,
      action: "loan_applied",
      metadata: { amount: loanAmount, months: loanMonths, monthlyPayment },
      req
    });

    return res.status(201).json({ message: "Loan आवेदन received", loan });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getVirtualCard = async (req, res) => {
  try {
    const result = await query("SELECT * FROM virtual_cards WHERE user_id = $1", [req.user.id]);
    const card = mapVirtualCard(result.rows[0]);
    if (!card) return res.status(404).json({ message: "No virtual card found" });
    return res.json({ card });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const generateVirtualCard = async (req, res) => {
  try {
    const existingResult = await query("SELECT id FROM virtual_cards WHERE user_id = $1", [req.user.id]);
    if (existingResult.rows.length > 0) return res.status(400).json({ message: "Card already exists" });

    let cardNumber = "";
    for (let i = 0; i < 16; i++) {
      cardNumber += Math.floor(Math.random() * 10).toString();
    }
    const cvv = Math.floor(100 + Math.random() * 900).toString();
    const year = new Date().getFullYear() + 4;
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const expiry = `${month}/${String(year).slice(-2)}`;

    const result = await query(
      "INSERT INTO virtual_cards (user_id, card_number, cvv, expiry, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [req.user.id, cardNumber, cvv, expiry, "active"]
    );
    const card = mapVirtualCard(result.rows[0]);

    return res.status(201).json({ message: "Card generated", card });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const freezeVirtualCard = async (req, res) => {
  try {
    const result = await query("SELECT * FROM virtual_cards WHERE user_id = $1", [req.user.id]);
    const card = mapVirtualCard(result.rows[0]);
    if (!card) return res.status(404).json({ message: "No virtual card found" });

    const newStatus = card.status === "frozen" ? "active" : "frozen";
    const updateResult = await query("UPDATE virtual_cards SET status = $1 WHERE user_id = $2 RETURNING *", [newStatus, req.user.id]);
    const updatedCard = mapVirtualCard(updateResult.rows[0]);

    return res.json({ message: `Card ${updatedCard.status}`, card: updatedCard });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteVirtualCard = async (req, res) => {
  try {
    await query("DELETE FROM virtual_cards WHERE user_id = $1", [req.user.id]);
    return res.json({ message: "Card deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const processCardTransaction = async (req, res) => {
  const client = await getClient();
  try {
    const { cardNumber, cvv, expiry, amount, merchantName } = req.body;
    const purchaseAmount = Number(amount);
    
    if (!purchaseAmount || purchaseAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const cardResult = await client.query(
      "SELECT * FROM virtual_cards WHERE card_number = $1 AND cvv = $2 AND expiry = $3",
      [cardNumber, cvv, expiry]
    );
    const card = mapVirtualCard(cardResult.rows[0]);
    
    if (!card) return res.status(400).json({ message: "Invalid card details" });
    if (card.status === "frozen") return res.status(400).json({ message: "Card is frozen" });

    const userResult = await client.query("SELECT * FROM users WHERE id = $1", [card.userId]);
    const user = mapUser(userResult.rows[0]);
    if (!user) return res.status(404).json({ message: "Linked user not found" });

    if (user.balance < purchaseAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    let status = "completed";
    let flagReason = "";
    
    const currentHour = new Date().getHours();
    const isUnusualTime = currentHour >= 1 && currentHour <= 5;
    const isLargeAmount = purchaseAmount > 50000;

    await client.query("BEGIN");

    if (isLargeAmount || isUnusualTime) {
      status = "flagged";
      flagReason = isLargeAmount ? "Amount exceeds 50000 limit" : "Unusual transaction time";
      await client.query("UPDATE users SET status_flag = 'flagged' WHERE id = $1", [user.id]);
    }

    await client.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [purchaseAmount, user.id]);

    const transResult = await client.query(
      "INSERT INTO transactions (sender_id, amount, type, source, merchant_name, status, flag_reason) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [user.id, purchaseAmount, "purchase", "virtual_card", merchantName || "Online Purchase", status, flagReason]
    );
    const transaction = mapTransaction(transResult.rows[0]);

    await client.query("COMMIT");

    return res.status(201).json({ message: "Transaction successful", transaction });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};
