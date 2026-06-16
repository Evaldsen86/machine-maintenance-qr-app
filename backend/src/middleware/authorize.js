const { ApiError } = require("../utils/apiError");

const requireAdmin = (req, _res, next) => {
  if (!req.auth) return next(new ApiError(401, "Authentication required"));
  if (req.auth.isCompanyAdmin || req.auth.roles.includes("admin")) return next();
  return next(new ApiError(403, "Admin access required"));
};

const requireRole = (...roles) => (req, _res, next) => {
  if (!req.auth) return next(new ApiError(401, "Authentication required"));
  if (req.auth.isCompanyAdmin) return next();
  if (roles.some((role) => req.auth.roles.includes(role))) return next();
  return next(new ApiError(403, "Insufficient role"));
};

const requirePermission = (...permissions) => (req, _res, next) => {
  if (!req.auth) return next(new ApiError(401, "Authentication required"));
  if (req.auth.isCompanyAdmin) return next();
  if (permissions.some((p) => req.auth.permissions.includes(p))) return next();
  return next(new ApiError(403, "Insufficient permission"));
};

module.exports = { requireAdmin, requireRole, requirePermission };

