import SecurityEvent from "../models/SecurityEvent.js";
import UserLog from "../models/UserLog.js";

let ioRef = null;

export const setSocketIO = (io) => {
  ioRef = io;
};

export const createSecurityEvent = async ({ user, type, details, severity = "medium" }) => {
  const event = await SecurityEvent.create({ user, type, details, severity });
  if (ioRef) ioRef.emit("security:event", event);
  return event;
};

const extractIpAddress = (req) => {
  const ip = req?.ip || "";
  if (typeof ip === "string") {
    return ip.split(",")[0].trim();
  }
  return "";
};

const detectDeviceType = (userAgent) => {
  const ua = String(userAgent || "").toLowerCase();
  if (ua.includes("iphone") || ua.includes("android") || ua.includes("mobile")) return "Phone";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "Mac";
  if (ua.includes("windows")) return "Windows";
  return "Unknown";
};

export const createUserLog = async ({ user, action, metadata = {}, req }) => {
  const userAgent = String(req?.headers?.["user-agent"] || "");
  const log = await UserLog.create({
    user,
    action,
    metadata,
    ip: extractIpAddress(req),
    userAgent,
    deviceType: detectDeviceType(userAgent)
  });
  if (ioRef) ioRef.emit("user:log", log);
  return log;
};
