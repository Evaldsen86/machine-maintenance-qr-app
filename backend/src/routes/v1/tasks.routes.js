const express = require("express");
const { asyncHandler } = require("../../middleware/asyncHandler");
const { validate } = require("../../middleware/validate");
const { requireAuth } = require("../../middleware/auth");
const { requireTenant } = require("../../middleware/tenant");
const { uuidParamSchema } = require("../../validators/common");
const { historyQuerySchema } = require("../../validators/timeEntrySchemas");
const timeEntryService = require("../../services/timeEntryService");

const router = express.Router();

router.use(requireAuth, requireTenant);

router.get(
  "/:id/time-entries",
  validate({ params: uuidParamSchema, query: historyQuerySchema }),
  asyncHandler(async (req, res) => {
    const entries = await timeEntryService.listHistoryForTask(req.auth, req.params.id, {
      includeArchived: req.query.includeArchived,
    });
    res.json({ success: true, data: entries });
  })
);

module.exports = router;
