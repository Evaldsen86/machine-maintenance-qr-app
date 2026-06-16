const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const env = require("./config/env");
const v1Routes = require("./routes/v1");
const { errorHandler } = require("./middleware/errorHandler");
const { ApiError } = require("./utils/apiError");

const app = express();

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients and same-origin no-origin requests.
    if (!origin) return callback(null, true);
    if (env.corsOrigins.length === 0) return callback(new Error("CORS_ORIGIN is not configured"));
    if (env.corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Backend foundation alive" });
});

app.use("/api/v1", v1Routes);

app.use((_req, _res, next) => {
  next(new ApiError(404, "Route not found"));
});

app.use(errorHandler);

module.exports = { app };

