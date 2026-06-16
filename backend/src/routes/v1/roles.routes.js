const express = require("express");
const { prisma } = require("../../lib/prisma");
const { asyncHandler } = require("../../middleware/asyncHandler");
const { validate } = require("../../middleware/validate");
const { requireAuth } = require("../../middleware/auth");
const { requireTenant, withTenantScope } = require("../../middleware/tenant");
const { requireAdmin } = require("../../middleware/authorize");
const { createRoleBodySchema } = require("../../validators/roleSchemas");
const { ApiError } = require("../../utils/apiError");

const router = express.Router();

router.use(requireAuth, requireTenant);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const roles = await prisma.role.findMany({
      where: withTenantScope({ deletedAt: null }, req),
      orderBy: { createdAt: "asc" },
    });
    res.json({ success: true, data: roles });
  })
);

router.post(
  "/",
  requireAdmin,
  validate({ body: createRoleBodySchema }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.role.findFirst({
      where: withTenantScope({ code: req.body.code }, req),
      select: { id: true },
    });
    if (existing) throw new ApiError(409, "Role code already exists");

    const role = await prisma.role.create({
      data: { ...req.body, companyId: req.tenant.companyId },
    });
    res.status(201).json({ success: true, data: role });
  })
);

module.exports = router;

