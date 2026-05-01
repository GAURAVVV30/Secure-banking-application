export const sendMoneyGuard = (req, _res, next) => {
  const amount = Number(req.body?.amount);
  const hour = new Date().getHours();

  const isOverThreshold = amount > 50000;
  const isRestrictedHour = hour >= 23 || hour <= 5;

  if (isOverThreshold && isRestrictedHour) {
    req.pendingAdminApproval = true;
    req.pendingReason = "Amount over 50,000 sent during restricted hours (23:00-05:59)";
  }

  next();
};
