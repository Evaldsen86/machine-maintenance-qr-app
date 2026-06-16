const express = require("express");
const { prisma } = require("../../lib/prisma");
const { asyncHandler } = require("../../middleware/asyncHandler");
const { validate } = require("../../middleware/validate");
const { createCompanyBodySchema } = require("../../validators/companySchemas");
const { requireAuth } = require("../../middleware/auth");
const { requireTenant } = require("../../middleware/tenant");
const { requireAdmin } = require("../../middleware/authorize");

const router = express.Router();

router.get(
  "/me",
  requireAuth,
  requireTenant,
  asyncHandler(async (req, res) => {
    const company = await prisma.company.findUnique({
      where: { id: req.tenant.companyId },
    });
    res.json({ success: true, data: company });
  })
);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  validate({ body: createCompanyBodySchema }),
  asyncHandler(async (req, res) => {
    const company = await prisma.company.create({
      data: req.body,
    });
    res.status(201).json({ success: true, data: company });
  })
);

module.exports = router;

