export const mapUser = (u) => {
  if (!u) return null;
  return {
    _id: u.id,
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    password: u.password,
    phone: u.phone,
    bankName: u.bank_name,
    bankBranch: u.bank_branch,
    accountNumber: u.account_number,
    accountType: u.account_type,
    pinHash: u.pin_hash,
    accountSetupAt: u.account_setup_at,
    role: u.role,
    balance: parseFloat(u.balance),
    loginAttempts: u.login_attempts,
    failedLoginAttempts: u.failed_login_attempts,
    lockUntil: u.lock_until,
    isTemporallyFlagged: u.is_temporally_flagged,
    isBlocked: u.is_blocked,
    statusFlag: u.status_flag,
    lastLoginAt: u.last_login_at,
    createdAt: u.created_at || u.createdAt || new Date(),
    updatedAt: u.updated_at || u.updatedAt || u.created_at || u.createdAt || new Date()
  };
};

export const mapTransaction = (t) => {
  if (!t) return null;
  return {
    _id: t.id,
    id: t.id,
    sender: t.sender_id,
    receiver: t.receiver_id,
    amount: parseFloat(t.amount),
    type: t.type,
    source: t.source,
    merchantName: t.merchant_name,
    status: t.status,
    flagReason: t.flag_reason,
    createdAt: t.created_at || t.createdAt || new Date(),
    updatedAt: t.updated_at || t.updatedAt || t.created_at || t.createdAt || new Date()
  };
};

export const mapVirtualCard = (c) => {
  if (!c) return null;
  return {
    _id: c.id,
    id: c.id,
    userId: c.user_id,
    cardNumber: c.card_number,
    cvv: c.cvv,
    expiry: c.expiry,
    status: c.status,
    createdAt: c.created_at || c.createdAt || new Date(),
    updatedAt: c.updated_at || c.updatedAt || c.created_at || c.createdAt || new Date()
  };
};

export const mapLoan = (l) => {
  if (!l) return null;
  return {
    _id: l.id,
    id: l.id,
    user: l.user_id,
    amount: parseFloat(l.amount),
    months: l.months,
    monthlyPayment: parseFloat(l.monthly_payment),
    status: l.status,
    createdAt: l.created_at || l.createdAt || new Date(),
    updatedAt: l.updated_at || l.updatedAt || l.created_at || l.createdAt || new Date()
  };
};

export const mapSecurityEvent = (e) => {
  if (!e) return null;
  return {
    _id: e.id,
    id: e.id,
    user: e.user_id,
    type: e.type,
    details: e.details,
    severity: e.severity,
    createdAt: e.created_at || e.createdAt || new Date(),
    updatedAt: e.updated_at || e.updatedAt || e.created_at || e.createdAt || new Date()
  };
};

export const mapUserLog = (log) => {
  if (!log) return null;
  return {
    _id: log.id,
    id: log.id,
    user: log.user_id,
    action: log.action,
    metadata: typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata,
    ip: log.ip,
    userAgent: log.user_agent,
    deviceType: log.device_type,
    createdAt: log.created_at || log.createdAt || new Date()
  };
};
