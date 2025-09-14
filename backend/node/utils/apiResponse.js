// utils/apiResponse.js

// Send success response with data and message
export function successResponse(res, message, data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

// Send error response with error message and optional code
export function errorResponse(res, error, statusCode = 500) {
  let message = error;
  if (error && error.message) message = error.message;

  return res.status(statusCode).json({
    success: false,
    message,
    errorCode: error.code || null,
    details: error.details || null,
    timestamp: new Date().toISOString(),
  });
}
