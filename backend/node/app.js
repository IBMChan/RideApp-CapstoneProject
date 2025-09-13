// entry point - app.js
import express from "express";
import env from "./config/envConfig.js";
import mysqlSequelize from "./config/dbConfig.js";
import pgSequelize from "./config/postgreConfig.js";
import { connectMongoDB } from "./config/mongoConfig.js";
import mysql from "mysql2/promise";
import riderRoutes from "./routes/riderRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();
const PORT = env.server.port;

(async () => {
  try {
    // 1️⃣ Connect MongoDB
    await connectMongoDB();

    // 2️⃣ Ensure MySQL database exists
    const connection = await mysql.createConnection({
      host: env.mysql.host,
      user: env.mysql.user,
      password: env.mysql.password,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${env.mysql.database}\`;`);
    console.log(`MySQL database "${env.mysql.database}" is ready.`);

    // 3️⃣ Authenticate MySQL Sequelize
    await mysqlSequelize.authenticate();
    console.log("MySQL (Sequelize) connection established successfully.");
    await mysqlSequelize.sync({ alter: true });
    console.log("MySQL models synced successfully.");

    // 4️⃣ Authenticate PostgreSQL Sequelize
    await pgSequelize.authenticate();
    console.log("PostgreSQL (Sequelize) connection established successfully.");

    // 5️⃣ Basic route
    app.get("/", (req, res) => {
      res.send("✅ All databases connected and Sequelize is running fine");
    });

    // Global Error Handler (Raksha & Harshit)
    app.use(errorHandler);

    // 6️⃣ Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to connect to the databases:", error);
  }
})();
