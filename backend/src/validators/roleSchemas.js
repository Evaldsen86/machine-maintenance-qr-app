const { z } = require("./common");

const createRoleBodySchema = z.object({
  code: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9_]+$/, "code must be lowercase letters, numbers, underscore"),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
});

module.exports = { createRoleBodySchema };

