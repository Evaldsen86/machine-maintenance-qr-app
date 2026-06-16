const { ApiError } = require("../utils/apiError");

const requireTenant = (req, _res, next) => {
  if (!req.auth?.companyId) return next(new ApiError(401, "Tenant context missing"));
  req.tenant = { companyId: req.auth.companyId };
  next();
};

const withTenantScope = (where = {}, req) => ({
  ...where,
  companyId: req.tenant.companyId,
});

module.exports = { requireTenant, withTenantScope };

