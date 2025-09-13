// app.js - Unified Entry Point

import { config as configDotenv } from "dotenv";
configDotenv();

import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import mysql from "mysql2/promise";
import sequelize from "./config/sqlConfig.js";
import { connectDB } from "./config/mongoConfig.js";
import pool from "./config/postgres.js";
import redisClient from "./config/redisConfig.js";


// Routes
import rideRoutes from "./routes/rideRoutes.js";
import riderRoutes from "./routes/riderRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";


const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middlewares ----------
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Simple logger middleware
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

// ---------- Health Check ----------
app.get("/", (req, res) => {
  res.send("Backend is running successfully! All DB connections are active.");
});

// ---------- Routes ----------
app.use("/api/rides", rideRoutes);
app.use("/api/rider", riderRoutes);
app.use("/api/driver", driverRoutes);

// ---------- Server & DB Connections ----------
(async () => {
  try {
    // 1️⃣ Connect MongoDB
    await connectDB();
    console.log("✅ MongoDB connected successfully");

    // 2️⃣ Connect MySQL & Ensure DB exists
    const { MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB } = process.env;

    const connection = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DB}\`;`);
    console.log(`✅ MySQL database "${MYSQL_DB}" is ready.`);

    // Sequelize Auth & Sync
    await sequelize.authenticate();
    console.log("✅ Sequelize connection established successfully.");
    await sequelize.sync();
    console.log("✅ Sequelize models synced successfully.");

    // 3️⃣ Connect PostgreSQL
    const res = await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL connected:", res.rows[0].now);

    // Connect Redis
    await redisClient.connect();
    console.log("✅ Redis connected");

    // 4️⃣ Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to connect to the database(s):", error);
    process.exit(1);
  }
})();

export default app;
