const express = require("express");
const { prisma } = require("../../lib/prisma");
const { asyncHandler } = require("../../middleware/asyncHandler");
const { validate } = require("../../middleware/validate");
const { requireAuth } = require("../../middleware/auth");
const { requireTenant, withTenantScope } = require("../../middleware/tenant");
const { requireAdmin } = require("../../middleware/authorize");
const { createMachineBodySchema, updateMachineBodySchema, machineIdParamSchema } = require("../../validators/machineSchemas");
const { ApiError } = require("../../utils/apiError");

const router = express.Router();

router.use(requireAuth, requireTenant);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const machines = await prisma.machine.findMany({
      where: withTenantScope({ deletedAt: null }, req),
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: machines });
  })
);

router.get(
  "/:id",
  validate({ params: machineIdParamSchema }),
  asyncHandler(async (req, res) => {
    const machine = await prisma.machine.findFirst({
      where: withTenantScope({ id: req.params.id, deletedAt: null }, req),
    });
    if (!machine) throw new ApiError(404, "Machine not found");
    res.json({ success: true, data: machine });
  })
);

router.post(
  "/",
  requireAdmin,
  validate({ body: createMachineBodySchema }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.machine.findFirst({
      where: withTenantScope({ serialNumber: req.body.serialNumber, deletedAt: null }, req),
      select: { id: true },
    });
    if (existing) throw new ApiError(409, "Machine serial number already exists");

    const machine = await prisma.machine.create({
      data: { ...req.body, companyId: req.tenant.companyId },
    });
    res.status(201).json({ success: true, data: machine });
  })
);

router.patch(
  "/:id",
  requireAdmin,
  validate({ params: machineIdParamSchema, body: updateMachineBodySchema }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.machine.findFirst({
      where: withTenantScope({ id: req.params.id, deletedAt: null }, req),
      select: { id: true },
    });
    if (!existing) throw new ApiError(404, "Machine not found");

    const machine = await prisma.machine.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: machine });
  })
);

router.delete(
  "/:id",
  requireAdmin,
  validate({ params: machineIdParamSchema }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.machine.findFirst({
      where: withTenantScope({ id: req.params.id, deletedAt: null }, req),
      select: { id: true },
    });
    if (!existing) throw new ApiError(404, "Machine not found");

    await prisma.machine.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    res.status(204).send();
  })
);

module.exports = router;

