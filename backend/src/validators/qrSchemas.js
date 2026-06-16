const { z, uuidParamSchema } = require("./common");

const createQrBodySchema = z.object({
  machineId: z.string().uuid(),
  qrToken: z.string().min(8).max(255),
  publicSlug: z.string().min(4).max(255).optional(),
  payloadHash: z.string().min(16).max(255).optional(),
  expiresAt: z.string().datetime().optional(),
  options: z.record(z.any()).optional(),
});

const validateQrBodySchema = z.object({
  qrToken: z.string().min(1).optional(),
  publicSlug: z.string().min(1).optional(),
  payloadHash: z.string().min(1).optional(),
});

module.exports = {
  createQrBodySchema,
  validateQrBodySchema,
  qrIdParamSchema: uuidParamSchema,
};

