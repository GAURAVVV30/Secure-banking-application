export const isUnusualLoginTime = (date = new Date()) => {
  const hour = date.getHours();
  return hour < 6 || hour >= 23;
};

export const isHugeTransfer = (amount) => amount >= 100000;
