const { ApiError } = require("../utils/apiError");

const errorHandler = (err, _req, res, _next) => {
  const status = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    console.error(err);
  }

  const payload = {
    success: false,
    message: status >= 500 && isProd ? "Internal server error" : err.message || "Unexpected error",
  };

  if (err instanceof ApiError && err.details) {
    payload.details = err.details;
  }

  if (!isProd && status >= 500) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
};

module.exports = { errorHandler };

