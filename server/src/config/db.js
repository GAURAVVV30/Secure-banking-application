import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "secure_banking",
  port: parseInt(process.env.DB_PORT || "5432"),
});

export const query = (text, params) => pool.query(text, params);

export const getClient = () => pool.connect();

export const initSchema = async () => {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await pool.query(schema);
  console.log("Database schema initialized");
};

export const connectDB = async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("PostgreSQL connected");
  } catch (err) {
    console.error("PostgreSQL connection error:", err.message);
    throw err;
  }
};

export default pool;
