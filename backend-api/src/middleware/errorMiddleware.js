function notFound(req, res) {
  return res.status(404).json({
    message: `Route not found: ${req.originalUrl}`,
  });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = error.statusCode;
  if (!statusCode && res.statusCode >= 400) {
    statusCode = res.statusCode;
  }

  if (!statusCode && error?.name === "ValidationError") {
    statusCode = 400;
  }

  if (!statusCode && error?.name === "CastError") {
    statusCode = 400;
  }

  if (!statusCode && error?.code === 11000) {
    statusCode = 409;
  }

  if (!statusCode) {
    statusCode = 500;
  }

  const message = error.message || "Internal server error.";

  return res.status(statusCode).json({
    message,
  });
}

module.exports = {
  notFound,
  errorHandler,
};
