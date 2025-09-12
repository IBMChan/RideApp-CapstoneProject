import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,      // <-- DB name
  process.env.DB_USER,      // <-- DB user
  process.env.DB_PASSWORD,  // <-- DB password
  {
    host: process.env.DB_HOST || "localhost",  // <-- DB host
    dialect: "mysql",
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  }
);

export default sequelize;
