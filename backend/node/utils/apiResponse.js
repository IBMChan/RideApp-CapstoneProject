export const successResponse = (res, message, data = {}, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const errorResponse = (res, error, status = 500) => {
  return res.status(status).json({
    success: false,
    message: error.message || "Internal Server Error",
    errorCode: error.code || null,
    details: error.details || null,
    timestamp: new Date().toISOString(),
  });
};
