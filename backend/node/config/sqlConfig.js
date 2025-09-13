// import { Sequelize } from "sequelize";
// import dotenv from "dotenv";

// dotenv.config();

// export const sequelize = new Sequelize(
//   process.env.MYSQL_DB,
//   process.env.MYSQL_USER,
//   process.env.MYSQL_PASSWORD,
//   {
//     host: process.env.MYSQL_HOST || "localhost",
//     dialect: "mysql",
//     logging: false,
//     pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
//   }
// );

// export default sequelize;

import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  }
);

export default sequelize;
