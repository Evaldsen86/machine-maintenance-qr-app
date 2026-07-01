const { prisma } = require("../lib/prisma");

/**
 * @param {object} params
 * @param {import('@prisma/client').Prisma.TransactionClient} [params.tx]
 */
const recordAuditLog = async ({
  tx,
  companyId,
  actorUserId,
  action,
  entityType,
  entityId,
  machineId,
  taskId,
  details,
  ipAddress,
  userAgent,
}) => {
  const client = tx || prisma;
  return client.auditLog.create({
    data: {
      companyId,
      actorUserId: actorUserId || null,
      action,
      entityType,
      entityId: entityId || null,
      machineId: machineId || null,
      taskId: taskId || null,
      details: details || undefined,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
  });
};

module.exports = { recordAuditLog };
