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

export const getAggregatedTotals = async (req, res) => {
  try {
    const userId = req.user.id;
    // Total Received: Transfers where I am receiver OR Deposits where I am the account owner
    const receivedRes = await query(
      "SELECT SUM(amount) as total FROM transactions WHERE (receiver_id = $1 OR (sender_id = $1 AND type = 'credit')) AND status = 'completed'",
      [userId]
    );
    // Total Outgoing: All transactions marked as debit where I am the sender
    const outgoingRes = await query(
      "SELECT SUM(amount) as total FROM transactions WHERE sender_id = $1 AND type = 'debit' AND status = 'completed'",
      [userId]
    );

    return res.json({
      totalReceived: parseFloat(receivedRes.rows[0].total || 0),
      totalOutgoing: parseFloat(outgoingRes.rows[0].total || 0)
    });
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

    const pinOk = await bcrypt.compare(String(pin).trim(), sender.pinHash);
    if (!pinOk) {
      return res.status(403).json({ message: "Invalid Security PIN" });
    }

    const receiverResult = await client.query("SELECT * FROM users WHERE phone = $1", [String(receiverPhone).trim()]);
    const receiver = mapUser(receiverResult.rows[0]);
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });

    if (sender.id === receiver.id) {
      return res.status(400).json({ message: "Cannot transfer to yourself" });
    }

    if (sender.balance < transferAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    await client.query("BEGIN");

    // Deduct from sender
    const updatedSender = await client.query(
      "UPDATE users SET balance = COALESCE(balance, 0) - $1 WHERE id = $2 RETURNING balance",
      [transferAmount, sender.id]
    );
    const newBalance = parseFloat(updatedSender.rows[0].balance);

    // Add to receiver
    await client.query(
      "UPDATE users SET balance = COALESCE(balance, 0) + $1 WHERE id = $2",
      [transferAmount, receiver.id]
    );

    // Create transaction - marked as DEBIT for sender
    const txRes = await client.query(
      "INSERT INTO transactions (sender_id, receiver_id, amount, type, category, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *",
      [sender.id, receiver.id, transferAmount, "debit", "transfer", "completed"]
    );
    const transaction = mapTransaction(txRes.rows[0]);

    await client.query("COMMIT");

    await createUserLog({
      user: sender.id,
      action: "transfer_sent",
      metadata: { amount: transferAmount, receiver: receiver.id, status: "completed" },
      req
    });

    return res.status(201).json({ message: "Transfer successful", transaction, newBalance });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    return res.status(500).json({ message: error.message });
  } finally {
    if (client) client.release();
  }
};

export const creditFunds = async (req, res) => {
  const client = await getClient();
  try {
    const { amount, pin } = req.body;
    const creditAmount = Number(amount);

    if (creditAmount <= 0) return res.status(400).json({ message: "Invalid amount" });

    const userResult = await client.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    const user = mapUser(userResult.rows[0]);

    const pinOk = await bcrypt.compare(String(pin).trim(), user.pinHash);
    if (!pinOk) return res.status(403).json({ message: "Invalid Security PIN" });

    await client.query("BEGIN");

    const updatedUser = await client.query(
      "UPDATE users SET balance = COALESCE(balance, 0) + $1 WHERE id = $2 RETURNING balance",
      [creditAmount, user.id]
    );
    const newBalance = parseFloat(updatedUser.rows[0].balance);

    // Create transaction - marked as CREDIT
    const txRes = await client.query(
      "INSERT INTO transactions (sender_id, amount, type, category, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *",
      [user.id, creditAmount, "credit", "credit", "completed"]
    );
    const transaction = mapTransaction(txRes.rows[0]);

    await client.query("COMMIT");

    await createUserLog({
      user: user.id,
      action: "credit_funds",
      metadata: { amount: creditAmount, status: "completed" },
      req
    });

    return res.status(201).json({ message: "Funds credited", transaction, newBalance });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    return res.status(500).json({ message: error.message });
  } finally {
    if (client) client.release();
  }
};

export const getHistory = async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM transactions WHERE sender_id = $1 OR receiver_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    const transactions = result.rows.map(mapTransaction);
    return res.json({ transactions });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const previewLoan = async (req, res) => {
  try {
    const { amount, months } = req.body;
    const loanAmount = parseFloat(amount);
    const duration = parseInt(months);

    const interestRate = 0.1;
    const totalAmount = loanAmount * (1 + interestRate);
    const monthlyPayment = totalAmount / duration;

    return res.json({
      amount: loanAmount,
      months: duration,
      monthlyPayment,
      totalAmount
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const confirmLoan = async (req, res) => {
  const client = await getClient();
  try {
    const { amount, months, monthlyPayment, loanType } = req.body;
    await client.query("BEGIN");

    const loanRes = await client.query(
      "INSERT INTO loans (user_id, amount, months, monthly_payment, loan_type, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *",
      [req.user.id, amount, months, monthlyPayment, loanType || 'Personal', "active"]
    );

    // Credit initial loan amount to user
    const updatedUser = await client.query(
      "UPDATE users SET balance = COALESCE(balance, 0) + $1 WHERE id = $2 RETURNING balance",
      [amount, req.user.id]
    );
    const newBalance = parseFloat(updatedUser.rows[0].balance);

    // Create transaction - marked as CREDIT (loan received)
    await client.query(
      "INSERT INTO transactions (sender_id, amount, type, category, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
      [req.user.id, amount, "credit", `loan_${loanType || 'payout'}`, "completed"]
    );

    await client.query("COMMIT");

    await createUserLog({
      user: req.user.id,
      action: "loan_confirmed",
      metadata: { amount, months, status: "active" },
      req
    });

    return res.status(201).json({ message: "Loan confirmed", loan: mapLoan(loanRes.rows[0]), newBalance });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    return res.status(500).json({ message: error.message });
  } finally {
    if (client) client.release();
  }
};

export const getVirtualCard = async (req, res) => {
  try {
    const result = await query("SELECT * FROM virtual_cards WHERE user_id = $1", [req.user.id]);
    const card = mapVirtualCard(result.rows[0]);
    return res.json({ card });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const generateVirtualCard = async (req, res) => {
  try {
    const cardNumber = "4242" + Math.random().toString().slice(2, 14);
    const cvv = Math.floor(100 + Math.random() * 900).toString();
    const expiry = "12/28";

    const result = await query(
      "INSERT INTO virtual_cards (user_id, card_number, cvv, expiry, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
      [req.user.id, cardNumber, cvv, expiry]
    );
    const card = mapVirtualCard(result.rows[0]);
    return res.status(201).json({ card });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const freezeVirtualCard = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await query(
      "UPDATE virtual_cards SET status = $1 WHERE user_id = $2 RETURNING *",
      [status, req.user.id]
    );
    const card = mapVirtualCard(result.rows[0]);
    return res.json({ card });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteVirtualCard = async (req, res) => {
  try {
    await query("DELETE FROM virtual_cards WHERE user_id = $1", [req.user.id]);
    return res.json({ message: "Card deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const processCardTransaction = async (req, res) => {
  const client = await getClient();
  try {
    const { cardNumber, cvv, amount, merchantName } = req.body;
    const txAmount = Number(amount);

    const cardRes = await client.query("SELECT * FROM virtual_cards WHERE card_number = $1 AND cvv = $2", [cardNumber, cvv]);
    const card = mapVirtualCard(cardRes.rows[0]);

    if (!card || card.status !== "active") return res.status(400).json({ message: "Invalid or inactive card" });

    const userRes = await client.query("SELECT * FROM users WHERE id = $1", [card.userId]);
    const user = mapUser(userRes.rows[0]);

    if (user.balance < txAmount) return res.status(400).json({ message: "Insufficient balance" });

    await client.query("BEGIN");

    const updatedUser = await client.query(
      "UPDATE users SET balance = COALESCE(balance, 0) - $1 WHERE id = $2 RETURNING balance",
      [txAmount, user.id]
    );
    const newBalance = parseFloat(updatedUser.rows[0].balance);

    // Create transaction - marked as DEBIT
    const txRes = await client.query(
      "INSERT INTO transactions (sender_id, amount, type, category, source, merchant_name, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *",
      [user.id, txAmount, "debit", "card_payment", "virtual_card", merchantName, "completed"]
    );
    const transaction = mapTransaction(txRes.rows[0]);

    await client.query("COMMIT");

    return res.status(201).json({ message: "Transaction successful", transaction, newBalance });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    return res.status(500).json({ message: error.message });
  } finally {
    if (client) client.release();
  }
};

export const getLoans = async (req, res) => {
  try {
    const result = await query("SELECT * FROM loans WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]);
    const loans = result.rows.map(mapLoan);
    return res.json({ loans });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const processBillPayment = async (req, res) => {
  const client = await getClient();
  try {
    const { type, cardNumber, cvv, pin, amount, merchantName, loanId } = req.body;
    const paymentAmount = Number(amount);
    
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (!type) return res.status(400).json({ message: "Payment type is required" });

    // 1. Verify Card
    const cardResult = await client.query(
      "SELECT * FROM virtual_cards WHERE card_number = $1 AND cvv = $2",
      [String(cardNumber).trim(), String(cvv).trim()]
    );
    const card = mapVirtualCard(cardResult.rows[0]);
    if (!card) return res.status(400).json({ message: "Invalid card details" });
    if (card.status === "frozen") return res.status(400).json({ message: "Card is frozen" });

    // 2. Verify User & PIN
    const userResult = await client.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    const user = mapUser(userResult.rows[0]);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (card.userId !== user.id) {
      return res.status(403).json({ message: "This card does not belong to you" });
    }

    const pinOk = await bcrypt.compare(String(pin).trim(), user.pinHash);
    if (!pinOk) return res.status(403).json({ message: "Invalid Security PIN" });

    // 3. Check Balance
    if (user.balance < paymentAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    await client.query("BEGIN");

    // 4. If Loan Payment, update loan status
    if (type === 'loan' && loanId) {
      const loanResult = await client.query("SELECT * FROM loans WHERE id = $1 AND user_id = $2", [loanId, user.id]);
      if (loanResult.rows.length === 0) {
        throw new Error("Loan not found");
      }
      await client.query("UPDATE loans SET status = 'paid' WHERE id = $1", [loanId]);
    }

    // 5. Deduct Balance
    const updatedUser = await client.query("UPDATE users SET balance = COALESCE(balance, 0) - $1 WHERE id = $2 RETURNING balance", [paymentAmount, user.id]);
    const newBalance = parseFloat(updatedUser.rows[0].balance);

    // 6. Create Transaction - marked as DEBIT
    const txRes = await client.query(
      "INSERT INTO transactions (sender_id, amount, type, category, source, merchant_name, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *",
      [user.id, paymentAmount, "debit", type, "virtual_card", merchantName || `Bill Payment: ${type}`, "completed"]
    );
    const transaction = mapTransaction(txRes.rows[0]);

    await client.query("COMMIT");

    // 7. Log for Admin Dashboard
    await createUserLog({
      user: user.id,
      action: `payment_${type}`,
      metadata: { amount: paymentAmount, type, status: "completed", loanId },
      req
    });

    return res.status(201).json({ message: `${type.toUpperCase()} Payment successful`, transaction, newBalance });

  } catch (error) {
    if (client) await client.query("ROLLBACK");
    return res.status(500).json({ message: error.message });
  } finally {
    if (client) client.release();
  }
};
