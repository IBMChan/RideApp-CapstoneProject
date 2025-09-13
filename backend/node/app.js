// entry point
import express from "express";
import bodyParser from "body-parser";
import { config as configDotenv } from "dotenv";
import mysql from "mysql2/promise";
import sequelize from "./config/sqlConfig.js";
import { connectDB } from "./config/mongoConfig.js";
import pool from "./config/postgres.js"; //

import riderRoutes from "./routes/riderRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";

configDotenv(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Backend is running successfully!");
});

(async () => {
  try {
    // 1️⃣ Connect MongoDB
    await connectDB();
    console.log("MongoDB connected successfully");

    // 2️⃣ Connect MySQL + Sequelize
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    console.log(`MySQL database "${DB_NAME}" is ready.`);

    await sequelize.authenticate();
    console.log("Sequelize connection established successfully.");
    await sequelize.sync({ alter: true });
    console.log("Models synced successfully.");

    // 3️⃣ Connect PostgreSQL
    const res = await pool.query("SELECT NOW()");
    console.log("PostgreSQL connected:", res.rows[0].now);

    // 4️⃣ Routes
    app.use("/rider", riderRoutes);
    app.use("/driver", driverRoutes);

    // 5️⃣ Start server
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database(s):", error);
    process.exit(1);
  }
})();
