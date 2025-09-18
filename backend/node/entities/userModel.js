import { DataTypes } from "sequelize";
import sequelize from "../config/sqlConfig.js";

const User = sequelize.define("User", {
  user_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  full_name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.ENUM("driver", "rider", "admin"),
    allowNull: false,
  },
  license: { type: DataTypes.STRING },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  gender: { type: DataTypes.STRING },
  kyc_type: { type: DataTypes.ENUM("pan", "aadhaar"), defaultValue: null },
  kyc_document: { type: DataTypes.STRING },
  emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  phoneVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  status: {
    type: DataTypes.ENUM("active", "inactive"),
    defaultValue: "active",
  },
  is_live_currently: {
    type: DataTypes.ENUM("yes", "no"),
    defaultValue: "yes",
  },
  },
  {
    tableName: "users",       // ✅ explicitly set table name
    timestamps: true,         // ✅ let Sequelize handle created/updated
    createdAt: "created_at",  // ✅ map to DB column
    updatedAt: "updated_at",  // ✅ map to DB column
    indexes: [
    {
      unique: true,
      fields: ["email"],
    },
  ],
});

export default User;






// import { DataTypes } from "sequelize";
// import sequelize from "../config/sqlConfig.js";

// const User = sequelize.define("User", {
//   user_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
//   full_name: { type: DataTypes.STRING, allowNull: false },
//   phone: { type: DataTypes.STRING, allowNull: false, unique: true },
//   email: { type: DataTypes.STRING, allowNull: false, unique: true },
//   role: { type: DataTypes.ENUM("driver", "rider", "admin"), allowNull: false },
//   license: { type: DataTypes.STRING },
//   password_hash: { type: DataTypes.STRING, allowNull: false },
//   gender: { type: DataTypes.STRING },
//   kyc_document: { type: DataTypes.STRING },
//   emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
//   phoneVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
// });

// export default User;