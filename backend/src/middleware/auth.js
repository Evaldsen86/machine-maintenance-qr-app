const { prisma } = require("../lib/prisma");
const { verifyAccessToken } = require("../utils/jwt");
const { ApiError } = require("../utils/apiError");

const extractBearer = (header) => {
  if (!header || typeof header !== "string") return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

const requireAuth = async (req, _res, next) => {
  try {
    const token = extractBearer(req.headers.authorization);
    if (!token) throw new ApiError(401, "Missing or invalid authorization header");

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findFirst({
      where: {
        id: payload.sub,
        companyId: payload.companyId,
        deletedAt: null,
      },
      include: {
        userRoles: {
          include: {
            role: true,
            permission: true,
          },
        },
      },
    });

    if (!user) throw new ApiError(401, "Authentication failed");

    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissions = user.userRoles
      .filter((ur) => ur.permission && ur.permission.code)
      .map((ur) => ur.permission.code);

    req.auth = {
      userId: user.id,
      companyId: user.companyId,
      isCompanyAdmin: Boolean(user.isCompanyAdmin),
      roles,
      permissions,
    };

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireAuth };

