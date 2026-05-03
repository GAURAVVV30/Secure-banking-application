import { query } from "../config/db.js";
import { mapSecurityEvent, mapUserLog } from "../utils/mapper.js";

let ioRef = null;

export const setSocketIO = (io) => {
  ioRef = io;
};

export const createSecurityEvent = async ({ user, type, details, severity = "medium" }) => {
  const result = await query(
    "INSERT INTO security_events (user_id, type, details, severity) VALUES ($1, $2, $3, $4) RETURNING *",
    [user, type, details, severity]
  );
  
  // Fetch user email for real-time update
  const userResult = await query("SELECT email, full_name FROM users WHERE id = $1", [user]);
  const userData = userResult.rows[0] || {};

  const event = {
    ...mapSecurityEvent(result.rows[0]),
    user: {
      _id: user,
      email: userData.email || "-",
      fullName: userData.full_name || "-"
    }
  };

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
  const result = await query(
    "INSERT INTO user_logs (user_id, action, metadata, ip, user_agent, device_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [user, action, JSON.stringify(metadata), extractIpAddress(req), userAgent, detectDeviceType(userAgent)]
  );

  // Fetch user email for real-time update
  const userResult = await query("SELECT email, full_name FROM users WHERE id = $1", [user]);
  const userData = userResult.rows[0] || {};

  const log = {
    ...mapUserLog(result.rows[0]),
    user: {
      _id: user,
      email: userData.email || "-",
      fullName: userData.full_name || "-"
    }
  };

  if (ioRef) ioRef.emit("user:log", log);
  return log;
};

