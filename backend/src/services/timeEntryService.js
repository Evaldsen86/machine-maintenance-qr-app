const { prisma } = require("../lib/prisma");
const { ApiError } = require("../utils/apiError");
const { recordAuditLog } = require("./auditLogService");
const {
  isAdmin,
  isLeader,
  isTechnician,
  TECHNICIAN_EDITABLE_STATUSES,
} = require("../utils/timeEntryRoles");

const tenantWhere = (companyId, extra = {}) => ({
  companyId,
  deletedAt: null,
  ...extra,
});

const computeDuration = (startTime, endTime, breakMinutes = 0) => {
  const ms = new Date(endTime).getTime() - new Date(startTime).getTime();
  if (ms < 0) throw new ApiError(400, "End time must be after start time");
  return Math.max(0, Math.round(ms / 60000) - breakMinutes);
};

const splitBillable = (durationMinutes, billableMinutes) => {
  const billable = Math.min(billableMinutes ?? durationMinutes, durationMinutes);
  return {
    billableMinutes: billable,
    nonBillableMinutes: Math.max(0, durationMinutes - billable),
  };
};

const assertTechnician = (auth) => {
  if (!isTechnician(auth)) throw new ApiError(403, "Technician access required");
};

const assertLeader = (auth) => {
  if (!isLeader(auth)) throw new ApiError(403, "Leader access required");
};

const assertAdmin = (auth) => {
  if (!isAdmin(auth)) throw new ApiError(403, "Admin access required");
};

const loadEntry = async (companyId, id) => {
  const entry = await prisma.timeEntry.findFirst({
    where: tenantWhere(companyId, { id }),
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      machine: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
      parts: { where: { deletedAt: null } },
    },
  });
  if (!entry) throw new ApiError(404, "Time entry not found");
  return entry;
};

const assertOwnOrLeader = (auth, entry) => {
  if (entry.userId === auth.userId) return;
  if (isLeader(auth)) return;
  throw new ApiError(403, "Not allowed to access this time entry");
};

const assertCanEditAsTechnician = (auth, entry) => {
  if (entry.userId !== auth.userId) throw new ApiError(403, "Not your time entry");
  if (!TECHNICIAN_EDITABLE_STATUSES.has(entry.status)) {
    throw new ApiError(409, `Cannot edit time entry in status ${entry.status}`);
  }
};

const resolveMachineFromTask = async (companyId, taskId, machineId) => {
  if (!taskId) return machineId || null;
  const task = await prisma.task.findFirst({
    where: tenantWhere(companyId, { id: taskId }),
    select: { id: true, machineId: true },
  });
  if (!task) throw new ApiError(404, "Task not found");
  if (machineId && machineId !== task.machineId) {
    throw new ApiError(400, "machineId does not match task machine");
  }
  return task.machineId;
};

const auditCtx = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get("user-agent"),
});

const startTimer = async (auth, body, req) => {
  assertTechnician(auth);

  const existingActive = await prisma.timeEntry.findFirst({
    where: tenantWhere(auth.companyId, { userId: auth.userId, status: "active" }),
  });
  if (existingActive) {
    throw new ApiError(409, "You already have an active time entry", { activeId: existingActive.id });
  }

  const machineId = await resolveMachineFromTask(auth.companyId, body.taskId, body.machineId);

  if (body.machineId) {
    const machine = await prisma.machine.findFirst({
      where: tenantWhere(auth.companyId, { id: body.machineId }),
      select: { id: true },
    });
    if (!machine) throw new ApiError(404, "Machine not found");
  }

  if (body.offerId) {
    const offer = await prisma.offer.findFirst({
      where: tenantWhere(auth.companyId, { id: body.offerId }),
      select: { id: true },
    });
    if (!offer) throw new ApiError(404, "Offer not found");
  }

  const entry = await prisma.$transaction(async (tx) => {
    const created = await tx.timeEntry.create({
      data: {
        companyId: auth.companyId,
        userId: auth.userId,
        machineId,
        taskId: body.taskId || null,
        customerId: body.customerId || null,
        offerId: body.offerId || null,
        equipmentType: body.equipmentType || null,
        description: body.description || "",
        startTime: new Date(),
        status: "active",
        source: "timer",
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        machine: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        parts: { where: { deletedAt: null } },
      },
    });

    await recordAuditLog({
      tx,
      companyId: auth.companyId,
      actorUserId: auth.userId,
      action: "create",
      entityType: "time_entry",
      entityId: created.id,
      machineId: created.machineId,
      taskId: created.taskId,
      details: { status: "active", source: "timer" },
      ...auditCtx(req),
    });

    return created;
  });

  return entry;
};

const getActiveTimer = async (auth) => {
  assertTechnician(auth);
  return prisma.timeEntry.findFirst({
    where: tenantWhere(auth.companyId, { userId: auth.userId, status: "active" }),
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      machine: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
      parts: { where: { deletedAt: null } },
    },
  });
};

const stopTimer = async (auth, id, body, req) => {
  assertTechnician(auth);
  const entry = await loadEntry(auth.companyId, id);
  assertCanEditAsTechnician(auth, entry);
  if (entry.status !== "active") throw new ApiError(409, "Only active entries can be stopped");

  const endTime = body.endTime ? new Date(body.endTime) : new Date();
  const breakMinutes = body.breakMinutes ?? entry.breakMinutes ?? 0;
  const durationMinutes = computeDuration(entry.startTime, endTime, breakMinutes);
  const { billableMinutes, nonBillableMinutes } = splitBillable(
    durationMinutes,
    body.billableMinutes ?? durationMinutes
  );

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.timeEntry.update({
      where: { id },
      data: {
        endTime,
        durationMinutes,
        breakMinutes,
        billableMinutes,
        nonBillableMinutes,
        description: body.description ?? entry.description,
        technicianNotes: body.technicianNotes ?? entry.technicianNotes,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        machine: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        parts: { where: { deletedAt: null } },
      },
    });

    await recordAuditLog({
      tx,
      companyId: auth.companyId,
      actorUserId: auth.userId,
      action: "status_change",
      entityType: "time_entry",
      entityId: id,
      machineId: row.machineId,
      taskId: row.taskId,
      details: { action: "stop", durationMinutes, endTime: endTime.toISOString() },
      ...auditCtx(req),
    });

    return row;
  });

  return updated;
};

const submitTimeEntry = async (auth, id, req) => {
  assertTechnician(auth);
  const entry = await loadEntry(auth.companyId, id);
  assertCanEditAsTechnician(auth, entry);

  if (!["draft", "active", "correction_requested", "submitted"].includes(entry.status)) {
    throw new ApiError(409, `Cannot submit from status ${entry.status}`);
  }

  if (!entry.endTime && entry.status !== "submitted") {
    throw new ApiError(400, "Stop the timer before submitting");
  }

  let durationMinutes = entry.durationMinutes;
  if (entry.endTime && entry.startTime) {
    durationMinutes = computeDuration(entry.startTime, entry.endTime, entry.breakMinutes);
  }
  if (durationMinutes == null || durationMinutes <= 0) {
    throw new ApiError(400, "Duration must be greater than zero to submit");
  }

  const { billableMinutes, nonBillableMinutes } = splitBillable(
    durationMinutes,
    entry.billableMinutes ?? durationMinutes
  );

  const fromStatus = entry.status;

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.timeEntry.update({
      where: { id },
      data: {
        status: "submitted",
        submittedAt: new Date(),
        durationMinutes,
        billableMinutes,
        nonBillableMinutes,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        machine: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        parts: { where: { deletedAt: null } },
      },
    });

    await recordAuditLog({
      tx,
      companyId: auth.companyId,
      actorUserId: auth.userId,
      action: "submit",
      entityType: "time_entry",
      entityId: id,
      machineId: row.machineId,
      taskId: row.taskId,
      details: { from: fromStatus, to: "submitted", durationMinutes },
      ...auditCtx(req),
    });

    return row;
  });

  return updated;
};

const approveTimeEntry = async (auth, id, body, req) => {
  assertLeader(auth);
  const entry = await loadEntry(auth.companyId, id);
  if (entry.status !== "submitted") throw new ApiError(409, "Only submitted entries can be approved");
  if (entry.userId === auth.userId && !isAdmin(auth)) {
    throw new ApiError(403, "You cannot approve your own time entry");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.timeEntry.update({
      where: { id },
      data: {
        status: "approved",
        approvedByUserId: auth.userId,
        approvedAt: new Date(),
        leaderNotes: body.leaderNotes ?? entry.leaderNotes,
        hourlyRateInternal: entry.hourlyRateInternal ?? 0,
        hourlyRateCustomer: entry.hourlyRateCustomer ?? null,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        machine: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        parts: { where: { deletedAt: null } },
      },
    });

    await recordAuditLog({
      tx,
      companyId: auth.companyId,
      actorUserId: auth.userId,
      action: "approve",
      entityType: "time_entry",
      entityId: id,
      machineId: row.machineId,
      taskId: row.taskId,
      details: { from: "submitted", to: "approved" },
      ...auditCtx(req),
    });

    return row;
  });

  return updated;
};

const rejectTimeEntry = async (auth, id, body, req) => {
  assertLeader(auth);
  const entry = await loadEntry(auth.companyId, id);
  if (entry.status !== "submitted") throw new ApiError(409, "Only submitted entries can be rejected");
  if (entry.userId === auth.userId && !isAdmin(auth)) {
    throw new ApiError(403, "You cannot reject your own time entry");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.timeEntry.update({
      where: { id },
      data: {
        status: "rejected",
        rejectedByUserId: auth.userId,
        rejectedAt: new Date(),
        leaderNotes: body.leaderNotes,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        machine: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        parts: { where: { deletedAt: null } },
      },
    });

    await recordAuditLog({
      tx,
      companyId: auth.companyId,
      actorUserId: auth.userId,
      action: "reject",
      entityType: "time_entry",
      entityId: id,
      machineId: row.machineId,
      taskId: row.taskId,
      details: { from: "submitted", to: "rejected", leaderNotes: body.leaderNotes },
      ...auditCtx(req),
    });

    return row;
  });

  return updated;
};

const requestCorrection = async (auth, id, body, req) => {
  assertLeader(auth);
  const entry = await loadEntry(auth.companyId, id);
  if (entry.status !== "submitted") {
    throw new ApiError(409, "Only submitted entries can be sent back for correction");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.timeEntry.update({
      where: { id },
      data: {
        status: "correction_requested",
        leaderNotes: body.leaderNotes,
        approvedByUserId: null,
        approvedAt: null,
        rejectedByUserId: null,
        rejectedAt: null,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        machine: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        parts: { where: { deletedAt: null } },
      },
    });

    await recordAuditLog({
      tx,
      companyId: auth.companyId,
      actorUserId: auth.userId,
      action: "status_change",
      entityType: "time_entry",
      entityId: id,
      machineId: row.machineId,
      taskId: row.taskId,
      details: { from: "submitted", to: "correction_requested", leaderNotes: body.leaderNotes },
      ...auditCtx(req),
    });

    return row;
  });

  return updated;
};

const patchTimeEntry = async (auth, id, body, req) => {
  const entry = await loadEntry(auth.companyId, id);
  assertCanEditAsTechnician(auth, entry);

  const data = {};
  if (body.description !== undefined) data.description = body.description;
  if (body.technicianNotes !== undefined) data.technicianNotes = body.technicianNotes;
  if (body.breakMinutes !== undefined) data.breakMinutes = body.breakMinutes;
  if (body.machineId !== undefined) data.machineId = body.machineId;
  if (body.taskId !== undefined) data.taskId = body.taskId;

  if (body.startTime) data.startTime = new Date(body.startTime);
  if (body.endTime) data.endTime = new Date(body.endTime);

  if (data.startTime && data.endTime) {
    const breakMinutes = body.breakMinutes ?? entry.breakMinutes ?? 0;
    const durationMinutes = computeDuration(data.startTime, data.endTime, breakMinutes);
    data.durationMinutes = durationMinutes;
    const split = splitBillable(durationMinutes, body.billableMinutes ?? entry.billableMinutes ?? durationMinutes);
    data.billableMinutes = split.billableMinutes;
    data.nonBillableMinutes = split.nonBillableMinutes;
  } else if (body.billableMinutes !== undefined && entry.durationMinutes != null) {
    const split = splitBillable(entry.durationMinutes, body.billableMinutes);
    data.billableMinutes = split.billableMinutes;
    data.nonBillableMinutes = split.nonBillableMinutes;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.timeEntry.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        machine: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        parts: { where: { deletedAt: null } },
      },
    });

    await recordAuditLog({
      tx,
      companyId: auth.companyId,
      actorUserId: auth.userId,
      action: "update",
      entityType: "time_entry",
      entityId: id,
      machineId: row.machineId,
      taskId: row.taskId,
      details: { fields: Object.keys(body) },
      ...auditCtx(req),
    });

    return row;
  });

  return updated;
};

const adminOverride = async (auth, id, body, req) => {
  assertAdmin(auth);
  const entry = await loadEntry(auth.companyId, id);

  const data = {};
  if (body.description !== undefined) data.description = body.description;
  if (body.technicianNotes !== undefined) data.technicianNotes = body.technicianNotes;
  if (body.leaderNotes !== undefined) data.leaderNotes = body.leaderNotes;
  if (body.breakMinutes !== undefined) data.breakMinutes = body.breakMinutes;
  if (body.billableMinutes !== undefined) data.billableMinutes = body.billableMinutes;
  if (body.durationMinutes !== undefined) data.durationMinutes = body.durationMinutes;
  if (body.status !== undefined) data.status = body.status;

  if (body.billableMinutes !== undefined && (data.durationMinutes ?? entry.durationMinutes) != null) {
    const duration = data.durationMinutes ?? entry.durationMinutes;
    const split = splitBillable(duration, body.billableMinutes);
    data.billableMinutes = split.billableMinutes;
    data.nonBillableMinutes = split.nonBillableMinutes;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.timeEntry.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        machine: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        parts: { where: { deletedAt: null } },
      },
    });

    await recordAuditLog({
      tx,
      companyId: auth.companyId,
      actorUserId: auth.userId,
      action: "update",
      entityType: "time_entry",
      entityId: id,
      machineId: row.machineId,
      taskId: row.taskId,
      details: {
        override: true,
        reason: body.reason,
        fields: Object.keys(data),
        fromStatus: entry.status,
        toStatus: row.status,
      },
      ...auditCtx(req),
    });

    return row;
  });

  return updated;
};

const getApprovalQueue = async (auth) => {
  assertLeader(auth);
  return prisma.timeEntry.findMany({
    where: tenantWhere(auth.companyId, { status: "submitted" }),
    orderBy: { submittedAt: "asc" },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      machine: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
      parts: { where: { deletedAt: null } },
    },
  });
};

const getTimeEntry = async (auth, id) => {
  const entry = await loadEntry(auth.companyId, id);
  assertOwnOrLeader(auth, entry);
  return entry;
};

const listHistoryForMachine = async (auth, machineId, { includeArchived = false }) => {
  const machine = await prisma.machine.findFirst({
    where: tenantWhere(auth.companyId, { id: machineId }),
    select: { id: true },
  });
  if (!machine) throw new ApiError(404, "Machine not found");

  const statusFilter = includeArchived ? {} : { status: { not: "archived" } };
  const scope = isLeader(auth) ? {} : { userId: auth.userId };

  return prisma.timeEntry.findMany({
    where: tenantWhere(auth.companyId, {
      machineId,
      ...statusFilter,
      ...scope,
    }),
    orderBy: { startTime: "desc" },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      machine: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
      parts: { where: { deletedAt: null } },
    },
  });
};

const listHistoryForTask = async (auth, taskId, { includeArchived = false }) => {
  const task = await prisma.task.findFirst({
    where: tenantWhere(auth.companyId, { id: taskId }),
    select: { id: true },
  });
  if (!task) throw new ApiError(404, "Task not found");

  const statusFilter = includeArchived ? {} : { status: { not: "archived" } };
  const scope = isLeader(auth) ? {} : { userId: auth.userId };

  return prisma.timeEntry.findMany({
    where: tenantWhere(auth.companyId, {
      taskId,
      ...statusFilter,
      ...scope,
    }),
    orderBy: { startTime: "desc" },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      machine: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
      parts: { where: { deletedAt: null } },
    },
  });
};

module.exports = {
  startTimer,
  getActiveTimer,
  stopTimer,
  submitTimeEntry,
  approveTimeEntry,
  rejectTimeEntry,
  requestCorrection,
  patchTimeEntry,
  adminOverride,
  getApprovalQueue,
  getTimeEntry,
  listHistoryForMachine,
  listHistoryForTask,
};
