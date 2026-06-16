const { z, uuidParamSchema } = require("./common");

const createUserBodySchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(200),
  password: z.string().min(8).max(128),
  phone: z.string().max(50).optional(),
  isCompanyAdmin: z.boolean().optional(),
});

const updateUserBodySchema = z
  .object({
    fullName: z.string().min(2).max(200).optional(),
    phone: z.string().max(50).nullable().optional(),
    status: z.enum(["active", "invited", "disabled"]).optional(),
    isCompanyAdmin: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "At least one field required");

module.exports = { createUserBodySchema, updateUserBodySchema, userIdParamSchema: uuidParamSchema };

