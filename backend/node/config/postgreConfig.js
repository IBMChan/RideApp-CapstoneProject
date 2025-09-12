// postgreConfig.js
import { Sequelize } from "sequelize";
import env from "./envConfig.js";

const pgSequelize = new Sequelize(
  env.postgre.database,
  env.postgre.user,
  env.postgre.password,
  {
    host: env.postgre.host,
    port: env.postgre.port,
    dialect: "postgres",
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export default pgSequelize;
