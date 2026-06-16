const express = require("express");
const bcrypt = require("bcryptjs");
const { prisma } = require("../../lib/prisma");
const { asyncHandler } = require("../../middleware/asyncHandler");
const { validate } = require("../../middleware/validate");
const { requireAuth } = require("../../middleware/auth");
const { requireTenant, withTenantScope } = require("../../middleware/tenant");
const { requireAdmin } = require("../../middleware/authorize");
const { createUserBodySchema, updateUserBodySchema, userIdParamSchema } = require("../../validators/userSchemas");
const { ApiError } = require("../../utils/apiError");

const router = express.Router();

router.use(requireAuth, requireTenant);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      where: withTenantScope({ deletedAt: null }, req),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        status: true,
        isCompanyAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ success: true, data: users });
  })
);

router.post(
  "/",
  requireAdmin,
  validate({ body: createUserBodySchema }),
  asyncHandler(async (req, res) => {
    const { password, ...rest } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);

    const existing = await prisma.user.findFirst({
      where: withTenantScope({ email: rest.email, deletedAt: null }, req),
      select: { id: true },
    });
    if (existing) {
      throw new ApiError(409, "User with this email already exists in company");
    }

    const user = await prisma.user.create({
      data: {
        ...rest,
        passwordHash,
        companyId: req.tenant.companyId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        status: true,
        isCompanyAdmin: true,
        createdAt: true,
      },
    });

    res.status(201).json({ success: true, data: user });
  })
);

router.patch(
  "/:id",
  requireAdmin,
  validate({ params: userIdParamSchema, body: updateUserBodySchema }),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findFirst({
      where: withTenantScope({ id: req.params.id, deletedAt: null }, req),
      select: { id: true },
    });
    if (!user) throw new ApiError(404, "User not found");

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: req.body,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        status: true,
        isCompanyAdmin: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: updated });
  })
);

module.exports = router;

