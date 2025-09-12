import { DataTypes } from "sequelize";
import { sequelize } from "../config/sqlConfig.js";
import User from "./userModel.js";

const Vehicle = sequelize.define(
  "Vehicle",
  {
    vehicle_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    driver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    make: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    plate_no: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: {
        name: "unique_plate",
        msg: "Plate number must be unique",
      },
    },
    color: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    vehicle_status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
    },
    seating: {
      type: DataTypes.INTEGER,
      validate: {
        isIn: {
          args: [[4, 7]],
          msg: "Seating must be either 4 or 7",
        },
      },
    },
    category: {
      type: DataTypes.ENUM("non_ac", "ac", "sedan", "suv"),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    tableName: "vehicles",
  }
);

// Associations
Vehicle.belongsTo(User, { foreignKey: "driver_id" });
User.hasMany(Vehicle, { foreignKey: "driver_id" });

export default Vehicle;
