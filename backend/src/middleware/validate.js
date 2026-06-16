const { ZodError } = require("zod");
const { ApiError } = require("../utils/apiError");

const validate =
  ({ body, params, query }) =>
  (req, _res, next) => {
    try {
      if (body) req.body = body.parse(req.body);
      if (params) req.params = params.parse(req.params);
      if (query) req.query = query.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new ApiError(400, "Validation failed", err.flatten()));
      }
      next(err);
    }
  };

module.exports = { validate };

