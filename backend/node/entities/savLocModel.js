// entities/savLocModel.js
import { DataTypes } from "sequelize";
import { pgSequelize } from "../config/pgConfig.js"; // separate config for PostgreSQL

const SavedLocation = pgSequelize.define(
  "SavedLocation",
  {
    saved_loc_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // Reference logically to MySQL `users.user_id`
      // Cross-DB constraints can't be enforced at DB level,
      // so handle validation in service.
    },
    label: {
      type: DataTypes.STRING(50),
      allowNull: false,
      // We'll enforce uniqueness per user in service logic
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    timestamps: false,
    tableName: "saved_locations",
    indexes: [
      {
        unique: true,
        fields: ["user_id", "label"], // ensures one "home", one "work", etc. per user
      },
    ],
  }
);

export default SavedLocation;
