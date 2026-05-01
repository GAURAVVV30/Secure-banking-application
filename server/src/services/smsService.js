export const sendSMS = async (phone, message) => {
  // Replace with Twilio/Fast2SMS/MSG91 integration in production.
  console.log(`[SMS:${process.env.SMS_SENDER || "Mock"}] to ${phone}: ${message}`);
};
