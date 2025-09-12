import { DataTypes } from "sequelize";
import { sequelize } from "../config/sqlConfig.js";
import User from "./userModel.js";
import Vehicle from "./vehicleModel.js";

const Ride = sequelize.define(
  "Ride",
  {
    ride_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    vehicle_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rider_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    driver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    pickup_loc: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    drop_loc: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "requested",
        "accepted",
        "in_progress",
        "cancelled",
        "completed",
        "expired"
      ),
      defaultValue: "requested",
    },
    distance: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    fare: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    ride_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    expiry_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    tableName: "rides",
    hooks: {
      beforeCreate: (ride) => {
        const rideDate = ride.ride_date ? new Date(ride.ride_date) : new Date();
        // Add 5 minutes
        ride.expiry_time = new Date(rideDate.getTime() + 5 * 60 * 1000);
      },
    },
  }
);

// Associations
Ride.belongsTo(Vehicle, { foreignKey: "vehicle_id" });
Vehicle.hasMany(Ride, { foreignKey: "vehicle_id" });

Ride.belongsTo(User, { foreignKey: "rider_id", as: "Rider" });
Ride.belongsTo(User, { foreignKey: "driver_id", as: "Driver" });

User.hasMany(Ride, { foreignKey: "rider_id", as: "RidesAsRider" });
User.hasMany(Ride, { foreignKey: "driver_id", as: "RidesAsDriver" });

export default Ride;

