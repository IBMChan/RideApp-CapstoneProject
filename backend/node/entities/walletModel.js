import { DataTypes } from "sequelize";
import pgSequelize from "../config/postgreConfig.js";

const Wallet =  pgSequelize.define("wallet", {
  wallet_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  pin: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  balance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.0,
    validate: {
      min: 0,
    },
  },
  last_updated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: "wallet",
});

export default Wallet;
