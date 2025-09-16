import { DataTypes } from "sequelize";
import pgSequelize from "../config/postgreConfig.js";

const WalletTransaction = pgSequelize.define("wallet_transaction", {
  transc_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  wallet_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  credit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  debit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  txn_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "pending"
  },
  razorpay_payment_id: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  timestamps: false,
  tableName: "wallet_transaction",
  validate: {
    creditOrDebit() {
      if (!(this.credit || this.debit)) {
        throw new Error("Either credit or debit must be non-null");
      }
      if (this.credit && this.debit) {
        throw new Error("Only one of credit or debit can be non-null");
      }
    }
  }
});

export default WalletTransaction;
