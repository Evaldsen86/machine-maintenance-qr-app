const { z } = require("./common");

const createCompanyBodySchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, and hyphens"),
  contactEmail: z.string().email().optional(),
  country: z.string().max(100).optional(),
});

module.exports = { createCompanyBodySchema };

