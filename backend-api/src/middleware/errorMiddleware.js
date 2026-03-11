function notFound(req, res) {
  return res.status(404).json({
    message: `Route not found: ${req.originalUrl}`,
  });
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error.";

  if (res.headersSent) {
    return next(error);
  }

  return res.status(statusCode).json({
    message,
  });
}

module.exports = {
  notFound,
  errorHandler,
};
