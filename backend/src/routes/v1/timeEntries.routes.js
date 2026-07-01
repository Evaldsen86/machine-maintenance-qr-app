const express = require("express");
const { asyncHandler } = require("../../middleware/asyncHandler");
const { validate } = require("../../middleware/validate");
const { requireAuth } = require("../../middleware/auth");
const { requireTenant } = require("../../middleware/tenant");
const {
  startTimeEntryBodySchema,
  stopTimeEntryBodySchema,
  patchTimeEntryBodySchema,
  leaderNotesBodySchema,
  optionalLeaderNotesBodySchema,
  adminOverrideBodySchema,
  timeEntryIdParamSchema,
} = require("../../validators/timeEntrySchemas");
const timeEntryService = require("../../services/timeEntryService");

const router = express.Router();

router.use(requireAuth, requireTenant);

router.post(
  "/start",
  validate({ body: startTimeEntryBodySchema }),
  asyncHandler(async (req, res) => {
    const entry = await timeEntryService.startTimer(req.auth, req.body, req);
    res.status(201).json({ success: true, data: entry });
  })
);

router.get(
  "/active",
  asyncHandler(async (req, res) => {
    const entry = await timeEntryService.getActiveTimer(req.auth);
    res.json({ success: true, data: entry });
  })
);

router.get(
  "/queue",
  asyncHandler(async (req, res) => {
    const entries = await timeEntryService.getApprovalQueue(req.auth);
    res.json({ success: true, data: entries });
  })
);

router.get(
  "/:id",
  validate({ params: timeEntryIdParamSchema }),
  asyncHandler(async (req, res) => {
    const entry = await timeEntryService.getTimeEntry(req.auth, req.params.id);
    res.json({ success: true, data: entry });
  })
);

router.post(
  "/:id/stop",
  validate({ params: timeEntryIdParamSchema, body: stopTimeEntryBodySchema }),
  asyncHandler(async (req, res) => {
    const entry = await timeEntryService.stopTimer(req.auth, req.params.id, req.body, req);
    res.json({ success: true, data: entry });
  })
);

router.post(
  "/:id/submit",
  validate({ params: timeEntryIdParamSchema }),
  asyncHandler(async (req, res) => {
    const entry = await timeEntryService.submitTimeEntry(req.auth, req.params.id, req);
    res.json({ success: true, data: entry });
  })
);

router.post(
  "/:id/approve",
  validate({ params: timeEntryIdParamSchema, body: optionalLeaderNotesBodySchema }),
  asyncHandler(async (req, res) => {
    const entry = await timeEntryService.approveTimeEntry(req.auth, req.params.id, req.body, req);
    res.json({ success: true, data: entry });
  })
);

router.post(
  "/:id/reject",
  validate({ params: timeEntryIdParamSchema, body: leaderNotesBodySchema }),
  asyncHandler(async (req, res) => {
    const entry = await timeEntryService.rejectTimeEntry(req.auth, req.params.id, req.body, req);
    res.json({ success: true, data: entry });
  })
);

router.post(
  "/:id/request-correction",
  validate({ params: timeEntryIdParamSchema, body: leaderNotesBodySchema }),
  asyncHandler(async (req, res) => {
    const entry = await timeEntryService.requestCorrection(req.auth, req.params.id, req.body, req);
    res.json({ success: true, data: entry });
  })
);

router.patch(
  "/:id/admin",
  validate({ params: timeEntryIdParamSchema, body: adminOverrideBodySchema }),
  asyncHandler(async (req, res) => {
    const entry = await timeEntryService.adminOverride(req.auth, req.params.id, req.body, req);
    res.json({ success: true, data: entry });
  })
);

router.patch(
  "/:id",
  validate({ params: timeEntryIdParamSchema, body: patchTimeEntryBodySchema }),
  asyncHandler(async (req, res) => {
    const entry = await timeEntryService.patchTimeEntry(req.auth, req.params.id, req.body, req);
    res.json({ success: true, data: entry });
  })
);

module.exports = router;
