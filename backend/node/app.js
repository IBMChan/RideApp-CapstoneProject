process.env.TZ = "Asia/Kolkata";
import { config as configDotenv } from "dotenv";
configDotenv();

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import http from "http";
import mysql from "mysql2/promise";
import sequelize from "./config/sqlConfig.js";
import { connectDB } from "./config/mongoConfig.js";
import pgSequelize from "./config/postgreConfig.js";
import redisClient from "./config/redisConfig.js";

// Entities / Models
import SavedLocation from "./entities/savLocModel.js";
import Wallet from "./entities/walletModel.js";
import WalletTransaction from "./entities/walletTransactionModel.js";

// Middlewares
import { errorHandler } from "./middlewares/errorHandler.js";
// import { authMiddleware } from "./middlewares/authMiddleware.js";

import { initSocket } from "./utils/socket.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";
import riderRoutes from "./routes/riderRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js"
import driverRoutes from "./routes/driverRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";



const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// init sockets
initSocket(server);

// ---------- Global Middlewares ----------
// Enable CORS (restrict to frontend origin, allow cookies)
app.use(
  cors({
    origin: "http://localhost", // frontend port 80
    credentials: true, // allow cookies
  })
);

// Parse JSON, form data & cookies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Simple request logger
app.use((req, res, next) => {
  console.log("📥 Request:", req.method, req.url);
  next();
});

// ---------- Health Check ----------
app.get("/", (_req, res) => {
  res.send("🚀 Backend is running successfully! All DB connections are active.");
});

// ---------- Routes ----------
// Public (no auth needed)
app.use("/api/auth", authRoutes);

// Apply AuthGuard for all routes below
// app.use(authMiddleware);

// Public (no auth needed)
app.use("/api/auth", authRoutes);

// Admin routes (login + protected admin endpoints)
app.use("/api/admin", adminRoutes);

// Protected Routes
app.use("/api/rides", rideRoutes);
app.use("/api/rider", riderRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/rider", ratingRoutes);

// Auth Check Endpoint (for frontend authGuard.js)
app.get("/api/auth/check", (req, res) => {
  res.json({
    message: "Authenticated",
    user: req.user,
  });
});

app.get("/api/geocode", async (req, res) => {
  try {
    const q = req.query.q;
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=5&addressdetails=1`, {
      headers: { "User-Agent": "RideApp/1.0" } // required by Nominatim
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "geocode failed" });
  }
});

// Global Error Handler
app.use(errorHandler);

// ---------- DB + Server Init ----------
(async () => {
  try {
    // 1️⃣ MongoDB
    await connectDB();
    console.log("✅ MongoDB connected successfully");

    // 2️⃣ Ensure MySQL DB exists
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    console.log(`✅ MySQL database "${DB_NAME}" is ready.`);
    await connection.end();

    // 3️⃣ Sequelize (MySQL)
    await sequelize.authenticate();
    console.log("✅ Sequelize connection established successfully.");
    await sequelize.sync({ alter: false, force: false });
    console.log("✅ Sequelize models synced successfully.");

    // 4️⃣ PostgreSQL
    await pgSequelize.authenticate();
    console.log("✅ PostgreSQL Sequelize connection established.");
    await SavedLocation.sync({ alter: true });
    console.log("✅ PostgreSQL models synced.");
    await Wallet.sync({ alter: true });
    console.log("✅ Wallet table synced.");
    await WalletTransaction.sync({ alter: true });
    console.log("✅ WalletTransaction table synced.");

    // 5️⃣ Redis
    await redisClient.connect();
    console.log("✅ Redis connected");

    // 6️⃣ Start Server
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to connect to the database(s):", error);
    process.exit(1);
  }
})();

export default app;

