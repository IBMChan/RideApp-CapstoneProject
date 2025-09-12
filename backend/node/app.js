// entry point
import express from "express";
import sequelize from "./config/sqlConfig.js";
import { configDotenv } from "dotenv";
import { connectDB } from "./config/mongoConfig.js";
import mysql from "mysql2/promise";

configDotenv(); // Load .env

const app = express();
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // 1️⃣ Connect MongoDB
    await connectDB();
    console.log("MongoDB connected successfully");

    // 2️⃣ Ensure MySQL database exists
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    console.log(`MySQL database "${DB_NAME}" is ready.`);

    // 3️⃣ Authenticate Sequelize
    await sequelize.authenticate();
    console.log("Sequelize connection established successfully.");

    // 4️⃣ Sync models
    await sequelize.sync({ alter: true });
    console.log("Models synced successfully.");

    // 5️⃣ Basic route
    app.get("/", (req, res) => {
      res.send("Sequelize is running and working fine");
    });

    // 6️⃣ Start server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();
