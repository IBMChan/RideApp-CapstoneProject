//.envConfig

// console.log("envConfig.js");

import dotenv from "dotenv";

dotenv.config();

export default {
    server: {
        port: process.env.PORT || 3000,
    },
    frontend: {
        url: process.env.FRONTEND_URL || "http://localhost:8080"
    },
    rateLimit: {
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    },
    mysql: {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || "3306",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "ibm_rideapp_capstone_db",
    },
    mongo: {
        uri: process.env.MONGO_URI || "mongodb://localhost:27017",
        dbName: process.env.MONGO_DB || "ibm_rideapp_capstone_db",
    },
    postgre: {
        host: process.env.PG_HOST || "localhost",
        port: process.env.PG_PORT || "5432",
        user: process.env.PG_USER || "postgres",
        password: process.env.PG_PASSWORD || "Raksha@2003",
        database: process.env.PG_DB || "ibm_rideapp_capstone_db",           
    },
    jwt: {
        secret: process.env.JWT_SECRET || "defaultsecret",
    },
};