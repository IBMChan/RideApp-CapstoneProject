// dbConfig.js
import { Sequelize } from "sequelize";
import env from "./envConfig.js";

const mysqlSequelize = new Sequelize(
  env.mysql.database,
  env.mysql.user,
  env.mysql.password,
  {
    host: env.mysql.host,
    port: env.mysql.port,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export default mysqlSequelize;