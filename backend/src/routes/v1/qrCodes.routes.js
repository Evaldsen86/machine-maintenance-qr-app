const express = require("express");
const { prisma } = require("../../lib/prisma");
const { asyncHandler } = require("../../middleware/asyncHandler");
const { validate } = require("../../middleware/validate");
const { requireAuth } = require("../../middleware/auth");
const { requireTenant, withTenantScope } = require("../../middleware/tenant");
const { requireAdmin } = require("../../middleware/authorize");
const { createQrBodySchema, validateQrBodySchema, qrIdParamSchema } = require("../../validators/qrSchemas");
const { ApiError } = require("../../utils/apiError");

const router = express.Router();

router.use(requireAuth, requireTenant);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const list = await prisma.qRCode.findMany({
      where: withTenantScope({ deletedAt: null }, req),
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: list });
  })
);

router.get(
  "/:id",
  validate({ params: qrIdParamSchema }),
  asyncHandler(async (req, res) => {
    const item = await prisma.qRCode.findFirst({
      where: withTenantScope({ id: req.params.id, deletedAt: null }, req),
    });
    if (!item) throw new ApiError(404, "QR code not found");
    res.json({ success: true, data: item });
  })
);

router.post(
  "/",
  requireAdmin,
  validate({ body: createQrBodySchema }),
  asyncHandler(async (req, res) => {
    const machine = await prisma.machine.findFirst({
      where: withTenantScope({ id: req.body.machineId, deletedAt: null }, req),
      select: { id: true },
    });
    if (!machine) throw new ApiError(404, "Machine not found in company");

    const created = await prisma.qRCode.create({
      data: {
        companyId: req.tenant.companyId,
        machineId: req.body.machineId,
        qrToken: req.body.qrToken,
        publicSlug: req.body.publicSlug || null,
        payloadHash: req.body.payloadHash || null,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
        options: req.body.options || undefined,
      },
    });
    res.status(201).json({ success: true, data: created });
  })
);

router.post(
  "/validate",
  validate({ body: validateQrBodySchema }),
  asyncHandler(async (req, res) => {
    const { qrToken, publicSlug, payloadHash } = req.body;
    if (!qrToken && !publicSlug && !payloadHash) {
      throw new ApiError(400, "At least one lookup field is required");
    }

    const or = [];
    if (qrToken) or.push({ qrToken });
    if (publicSlug) or.push({ publicSlug });
    if (payloadHash) or.push({ payloadHash });

    const item = await prisma.qRCode.findFirst({
      where: withTenantScope(
        {
          deletedAt: null,
          status: "active",
          OR: or,
        },
        req
      ),
      include: {
        machine: true,
      },
    });

    if (!item) throw new ApiError(404, "QR code not found");
    if (item.expiresAt && item.expiresAt < new Date()) {
      throw new ApiError(410, "QR code expired");
    }

    const updated = await prisma.qRCode.update({
      where: { id: item.id },
      data: { lastScannedAt: new Date(), lastScannedByIp: req.ip || null },
      include: { machine: true },
    });

    res.json({ success: true, data: updated });
  })
);

module.exports = router;

