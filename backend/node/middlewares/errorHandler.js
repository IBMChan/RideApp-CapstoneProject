// Raksha & Harshit
// middlewares/errorHandler.js
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../utils/app.errors.js";

export const errorHandler = (err, req, res, next) => {
  console.error(err); // Log for debugging (optional: use Winston or Morgan later)

  // Handle known custom errors
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof ConflictError) {
    return res.status(409).json({ error: err.message });
  }

  // Handle Sequelize/Mongoose validation errors (fallback)
  if (err.name === "SequelizeValidationError" || err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  // Unknown/unexpected errors
  res.status(500).json({ error: "Internal Server Error" });
};
