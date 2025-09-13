class AppError extends Error {
  constructor(message, statusCode = 400, code = "BAD_REQUEST", details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Convenience factory functions for common error types
export const NotFoundError = (msg = "Not Found") =>
  new AppError(msg, 404, "NOT_FOUND");

export const ValidationError = (msg = "Validation Error", details = null) =>
  new AppError(msg, 400, "VALIDATION_ERROR", details);

export const ConflictError = (msg = "Conflict") =>
  new AppError(msg, 409, "CONFLICT");

export default AppError;