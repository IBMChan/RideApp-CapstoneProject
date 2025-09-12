// app.js - entry point

import express from "express";
import sequelize from "./config/sqlConfig.js";
import { configDotenv } from "dotenv";
import { connectDB } from "./config/mongoConfig.js";
import cookieParser from "cookie-parser";
import rideRoutes from "./routes/rideRoutes.js";

configDotenv();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Simple logger middleware
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

app.get("/", (req, res) => {
  res.send("Server is running. Sequelize & MongoDB are connected.");
});

// Routes
app.use("/api/rides", rideRoutes);

async function startServer() {
  try {
    // MongoDB Connection
    await connectDB();
    console.log("MongoDB connection established successfully...");

    // MySQL Connection
    await sequelize.authenticate();
    console.log("MySQL connection established successfully...");

    await sequelize.sync({ alter: true });
    console.log("MySQL Models synced successfully...");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1); 
  }
}

startServer();

export default app;
