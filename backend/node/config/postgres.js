import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PG_USER || "postgres",
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DATABASE || "postgres",
  password: process.env.PG_PASSWORD || "your_password_here",
  port: process.env.PG_PORT || 5432,
});

// Test connection immediately when the app starts
(async () => {
  try {
    const res = await pool.query("SELECT NOW()");
  } catch (err) {
  }
})();

export default pool;
