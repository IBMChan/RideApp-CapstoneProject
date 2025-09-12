//entry point 

import express from "express";
import sequelize from "./config/dbConfig.js";
import { configDotenv } from "dotenv";

const app = express();
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // Authenticate DB connection
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    // Sync models
    await sequelize.sync({ alter: true });
    console.log("Models synced successfully.");

    app.get("/", (req, res) => {
      res.send("Sequelize is running and working fine");
    });

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();
