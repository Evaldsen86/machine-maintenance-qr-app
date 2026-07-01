const { z } = require("./common").z;

const uuid = z.string().uuid();

const startTimeEntryBodySchema = z.object({
  machineId: uuid.optional(),
  taskId: uuid.optional(),
  customerId: uuid.optional(),
  offerId: uuid.optional(),
  equipmentType: z.string().max(64).optional(),
  description: z.string().max(5000).optional(),
});

const stopTimeEntryBodySchema = z.object({
  endTime: z.string().datetime().optional(),
  breakMinutes: z.number().int().min(0).max(24 * 60).optional(),
  billableMinutes: z.number().int().min(0).optional(),
  description: z.string().max(5000).optional(),
  technicianNotes: z.string().max(5000).optional(),
});

const patchTimeEntryBodySchema = z
  .object({
    description: z.string().max(5000).optional(),
    technicianNotes: z.string().max(5000).optional(),
    breakMinutes: z.number().int().min(0).max(24 * 60).optional(),
    billableMinutes: z.number().int().min(0).optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    machineId: uuid.optional().nullable(),
    taskId: uuid.optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field required" });

const leaderNotesBodySchema = z.object({
  leaderNotes: z.string().min(1).max(5000),
});

const optionalLeaderNotesBodySchema = z.object({
  leaderNotes: z.string().max(5000).optional(),
});

const adminOverrideBodySchema = z.object({
  reason: z.string().min(1).max(2000),
  description: z.string().max(5000).optional(),
  technicianNotes: z.string().max(5000).optional(),
  leaderNotes: z.string().max(5000).optional(),
  breakMinutes: z.number().int().min(0).max(24 * 60).optional(),
  billableMinutes: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(0).optional(),
  status: z
    .enum([
      "draft",
      "active",
      "submitted",
      "approved",
      "rejected",
      "correction_requested",
      "exported_to_payroll",
      "invoiced",
      "archived",
    ])
    .optional(),
});

const timeEntryIdParamSchema = z.object({
  id: uuid,
});

const historyQuerySchema = z.object({
  includeArchived: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

module.exports = {
  startTimeEntryBodySchema,
  stopTimeEntryBodySchema,
  patchTimeEntryBodySchema,
  leaderNotesBodySchema,
  optionalLeaderNotesBodySchema,
  adminOverrideBodySchema,
  timeEntryIdParamSchema,
  historyQuerySchema,
};
