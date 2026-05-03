import pkg from 'pg';
const { Client } = pkg;
import 'dotenv/config';

async function fixTimestamps() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    console.log("Connected to DB. Fixing timestamps...");
    
    await client.query("UPDATE user_logs SET created_at = NOW() WHERE created_at IS NULL");
    await client.query("UPDATE security_events SET created_at = NOW() WHERE created_at IS NULL");
    await client.query("UPDATE transactions SET created_at = NOW() WHERE created_at IS NULL");
    await client.query("UPDATE loans SET created_at = NOW() WHERE created_at IS NULL");
    await client.query("UPDATE virtual_cards SET created_at = NOW() WHERE created_at IS NULL");
    
    console.log("Timestamps fixed successfully.");
  } catch (err) {
    console.error("Error fixing timestamps:", err);
  } finally {
    await client.end();
  }
}

fixTimestamps();
