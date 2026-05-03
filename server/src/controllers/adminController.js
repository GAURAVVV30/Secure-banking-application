import { query } from "../config/db.js";
import { mapUser, mapTransaction, mapLoan, mapSecurityEvent, mapUserLog } from "../utils/mapper.js";

const deleteUserData = async (userId) => {
  await query("DELETE FROM transactions WHERE sender_id = $1 OR receiver_id = $1", [userId]);
  await query("DELETE FROM loans WHERE user_id = $1", [userId]);
  await query("DELETE FROM security_events WHERE user_id = $1", [userId]);
  await query("DELETE FROM user_logs WHERE user_id = $1", [userId]);
};

export const getUsersByBank = async (req, res) => {
  try {
    const { bankName } = req.query;
    let sql = "SELECT * FROM users WHERE role != 'admin'";
    let params = [];
    
    if (bankName) {
      sql += " AND bank_name = $1";
      params.push(bankName);
    }
    
    sql += " ORDER BY created_at DESC";
    const result = await query(sql, params);
    const users = result.rows.map(u => {
      const mapped = mapUser(u);
      delete mapped.password;
      return mapped;
    });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUserFullHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const userResult = await query("SELECT * FROM users WHERE id = $1", [userId]);
    const user = mapUser(userResult.rows[0]);
    if (!user) return res.status(404).json({ message: "User not found" });
    delete user.password;

    const transResult = await query(
      `SELECT t.*, 
              s.email as sender_email, s.full_name as sender_name, s.bank_name as sender_bank,
              r.email as receiver_email, r.full_name as receiver_name, r.bank_name as receiver_bank
       FROM transactions t
       LEFT JOIN users s ON t.sender_id = s.id
       LEFT JOIN users r ON t.receiver_id = r.id
       WHERE t.sender_id = $1 OR t.receiver_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );
    const transactions = transResult.rows.map(t => ({
      ...mapTransaction(t),
      sender: t.sender_id ? { email: t.sender_email, fullName: t.sender_name, bankName: t.sender_bank } : null,
      receiver: t.receiver_id ? { email: t.receiver_email, fullName: t.receiver_name, bankName: t.receiver_bank } : null
    }));

    const loansResult = await query("SELECT * FROM loans WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    const loans = loansResult.rows.map(mapLoan);

    const securityEventsResult = await query("SELECT * FROM security_events WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    const securityEvents = securityEventsResult.rows.map(mapSecurityEvent);

    const logsResult = await query("SELECT * FROM user_logs WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    const logs = logsResult.rows.map(mapUserLog);

    return res.json({ user, transactions, loans, securityEvents, logs });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getSecurityFeed = async (_req, res) => {
  try {
    const eventsResult = await query(
      `SELECT e.id, e.user_id, e.type, e.details, e.severity, e.created_at as created_at, u.email, u.full_name, u.bank_name, u.is_blocked, u.is_temporally_flagged, u.status_flag
       FROM security_events e
       JOIN users u ON e.user_id = u.id
       ORDER BY e.created_at DESC`
    );
    const events = eventsResult.rows.map(e => {
      const mapped = mapSecurityEvent(e);
      return {
        ...mapped,
        user: {
          _id: e.user_id,
          id: e.user_id,
          email: e.email,
          fullName: e.full_name,
          bankName: e.bank_name,
          isBlocked: e.is_blocked,
          isTemporallyFlagged: e.is_temporally_flagged,
          statusFlag: e.status_flag
        }
      };
    });

    const logsResult = await query(
      `SELECT l.id, l.user_id, l.action, l.metadata, l.ip, l.user_agent, l.device_type, l.created_at as created_at, u.email, u.full_name, u.bank_name, u.is_blocked, u.is_temporally_flagged, u.status_flag
       FROM user_logs l
       JOIN users u ON l.user_id = u.id
       ORDER BY l.created_at DESC LIMIT 200`
    );

    const logs = logsResult.rows.map(l => {
      const mapped = mapUserLog(l);
      return {
        ...mapped,
        user: {
          _id: l.user_id,
          id: l.user_id,
          email: l.email,
          fullName: l.full_name,
          bankName: l.bank_name,
          isBlocked: l.is_blocked,
          isTemporallyFlagged: l.is_temporally_flagged,
          statusFlag: l.status_flag
        }
      };
    });

    return res.json({ events, logs });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const userResult = await query("SELECT * FROM users WHERE id = $1", [userId]);
    const user = mapUser(userResult.rows[0]);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(400).json({ message: "Admin cannot be blocked" });

    const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    await query(
      "UPDATE users SET is_blocked = true, status_flag = 'blocked', lock_until = $2 WHERE id = $1",
      [userId, lockUntil]
    );

    return res.json({ message: "User blocked" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const userResult = await query("SELECT * FROM users WHERE id = $1", [userId]);
    const user = mapUser(userResult.rows[0]);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(400).json({ message: "Admin cannot be deleted" });

    await deleteUserData(userId);
    await query("DELETE FROM users WHERE id = $1", [userId]);
    return res.json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteBank = async (req, res) => {
  try {
    const { bankName } = req.params;
    const usersResult = await query("SELECT id FROM users WHERE bank_name = $1 AND role != 'admin'", [bankName]);
    if (usersResult.rows.length === 0) return res.status(404).json({ message: "Bank not found" });

    const userIds = usersResult.rows.map(u => u.id);
    
    // Postgres doesn't support $1 = ANY($2) as easily as IN (...) with multiple params without some tricks, 
    // but we can use WHERE user_id = ANY($1) with an array.
    await query("DELETE FROM transactions WHERE sender_id = ANY($1) OR receiver_id = ANY($1)", [userIds]);
    await query("DELETE FROM loans WHERE user_id = ANY($1)", [userIds]);
    await query("DELETE FROM security_events WHERE user_id = ANY($1)", [userIds]);
    await query("DELETE FROM user_logs WHERE user_id = ANY($1)", [userIds]);
    await query("DELETE FROM virtual_cards WHERE user_id = ANY($1)", [userIds]);
    await query("DELETE FROM users WHERE bank_name = $1 AND role != 'admin'", [bankName]);

    return res.json({ message: `${bankName} deleted` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
