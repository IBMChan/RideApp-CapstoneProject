// models/rideDriverAssignment.js
import { DataTypes } from "sequelize";
import sequelize from "../config/sqlConfig.js";
import Ride from "./rideModel.js";

const RideDriverAssignment = sequelize.define(
  "RideDriverAssignment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ride_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Rides",
        key: "ride_id",
      },
      onDelete: "CASCADE",
    },
    driver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "user_id",
      },
      onDelete: "CASCADE",
    },
    distance: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    tableName: "ride_driver_assignments",
    timestamps: true,
  }
);

RideDriverAssignment.belongsTo(Ride, { foreignKey: "ride_id", as: "ride" });
Ride.hasMany(RideDriverAssignment, { foreignKey: "ride_id", as: "assignments" });

export default RideDriverAssignment;
