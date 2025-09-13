// app.js - Unified Entry Point

import { config as configDotenv } from "dotenv";
configDotenv();

import express from "express";
import cookieParser from "cookie-parser";
import mysql from "mysql2/promise";
import sequelize from "./config/sqlConfig.js";
import { connectDB } from "./config/mongoConfig.js";
import pool from "./config/postgres.js";
import redisClient from "./config/redisConfig.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";
import riderRoutes from "./routes/riderRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";


const app = express();
const PORT = process.env.PORT;

// ---------- Middlewares ----------
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Simple logger middleware
app.use((req, res, next) => {
  console.log("📥 Incoming request:", req.method, req.url);
  next();
});

// ---------- Health Check ----------
app.get("/", (_req, res) => {
  res.send("🚀 Backend is running successfully! All DB connections are active.");
});

// ---------- Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/rider", riderRoutes);
app.use("/api/driver", driverRoutes);

// ---------- Server & DB Connections ----------
(async () => {
  try {
    // 1️⃣ Connect MongoDB
    await connectDB();
    console.log("✅ MongoDB connected successfully");

    // 2️⃣ Ensure MySQL database exists
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    const connection = await mysql.createConnection({
      host: env.mysql.host,
      user: env.mysql.user,
      password: env.mysql.password,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    console.log(`✅ MySQL database "${DB_NAME}" is ready.`);
    await connection.end();

    // 3️⃣ Sequelize Auth & Sync
    await sequelize.authenticate();
    console.log("✅ Sequelize connection established successfully.");
    await sequelize.sync({ alter: true });
    console.log("✅ Sequelize models synced successfully.");

    // 4️⃣ Connect PostgreSQL
    const res = await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL connected:", res.rows[0].now);

    // // Connect Redis
    // await redisClient.connect();
    // console.log("✅ Redis connected");

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
