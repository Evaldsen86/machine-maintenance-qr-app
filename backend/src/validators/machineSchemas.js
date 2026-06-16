const { z, uuidParamSchema } = require("./common");

const machineStatusSchema = z.enum(["active", "inactive", "maintenance", "repair", "retired"]);

const createMachineBodySchema = z.object({
  name: z.string().min(1).max(200),
  model: z.string().min(1).max(200),
  brand: z.string().max(200).optional(),
  serialNumber: z.string().min(1).max(200),
  status: machineStatusSchema.optional(),
  description: z.string().max(5000).optional(),
  locationName: z.string().max(200).optional(),
  locationAddress: z.string().max(300).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  specifications: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

const updateMachineBodySchema = createMachineBodySchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, "At least one field required");

module.exports = {
  createMachineBodySchema,
  updateMachineBodySchema,
  machineIdParamSchema: uuidParamSchema,
};

