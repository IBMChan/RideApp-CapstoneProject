import { DataTypes } from "sequelize";
import  sequelize  from "../config/sqlConfig.js";

const User = sequelize.define(
  "User",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: {
        name: "unique_phone",
        msg: "Phone must be unique",
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        name: "unique_email",
        msg: "Email must be unique",
      },
      validate: {
        isEmail: { msg: "Invalid email format" },
      },
    },
    role: {
      type: DataTypes.ENUM("driver", "rider", "admin"),
      allowNull: false,
    },
    license: {
      type: DataTypes.STRING(100),
      allowNull: true, // enforce in service if role=driver
    },
    kyc_document: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM("male", "female", "other"),
      allowNull: true,
    },
    wallet_balance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
    total_earnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
    is_live_currently: {
      type: DataTypes.ENUM("yes", "no"),
      defaultValue: "no",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    tableName: "users",
  }
);

export default User;
