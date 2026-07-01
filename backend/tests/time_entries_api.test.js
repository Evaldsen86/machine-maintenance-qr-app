const request = require("supertest");

const RUN_DB_TESTS =
  process.env.RUN_PHASE6A_DB_TESTS === "true" &&
  Boolean(process.env.DATABASE_URL) &&
  Boolean(process.env.JWT_SECRET);

describe("Time entries API (integration)", () => {
  if (!RUN_DB_TESTS) {
    test("skipped (set RUN_PHASE6A_DB_TESTS=true and configure DATABASE_URL/JWT_SECRET)", () => {
      expect(true).toBe(true);
    });
    return;
  }

  const { app } = require("../src/app");
  const { prisma } = require("../src/lib/prisma");

  const leaderEmail = (process.env.SEED_LEADER_EMAIL || "leader@maskiina.local").toLowerCase();
  const techEmail = (process.env.SEED_TECH_EMAIL || "tech@maskiina.local").toLowerCase();
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@maskiina.local").toLowerCase();
  const password = process.env.SEED_TECH_PASSWORD || "ChangeMe123!";

  let leaderToken;
  let techToken;
  let adminToken;
  let machineId;
  let taskId;
  let entryId;
  let companyId;

  const futureEndTime = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const login = async (email) => {
    const res = await request(app).post("/api/v1/auth/login").send({ email, password });
    expect(res.status).toBe(200);
    return res.body.token;
  };

  beforeAll(async () => {
    await prisma.$connect();
    const { execSync } = require("child_process");
    execSync("node src/scripts/seed.js", { cwd: __dirname + "/.." });

    leaderToken = await login(leaderEmail);
    techToken = await login(techEmail);
    adminToken = await login(adminEmail);

    const techUser = await prisma.user.findFirst({ where: { email: techEmail } });
    companyId = techUser.companyId;

    const machineRes = await request(app)
      .post("/api/v1/machines")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Time Test Machine",
        model: "TT-1",
        serialNumber: "TIME-TEST-" + Date.now(),
        specifications: {},
        status: "active",
      });
    expect(machineRes.status).toBe(201);
    machineId = machineRes.body.data.id;

    const task = await prisma.task.create({
      data: {
        companyId,
        machineId,
        title: "Time test task",
        status: "in_progress",
      },
    });
    taskId = task.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Technician can start, stop, and submit time entry", async () => {
    const startRes = await request(app)
      .post("/api/v1/time-entries/start")
      .set("Authorization", `Bearer ${techToken}`)
      .send({ machineId, taskId, description: "Repair work" });
    expect(startRes.status).toBe(201);
    entryId = startRes.body.data.id;
    expect(startRes.body.data.status).toBe("active");

    const activeRes = await request(app)
      .get("/api/v1/time-entries/active")
      .set("Authorization", `Bearer ${techToken}`);
    expect(activeRes.status).toBe(200);
    expect(activeRes.body.data.id).toBe(entryId);

    const startTime = startRes.body.data.startTime;
    const endTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();

    const stopRes = await request(app)
      .post(`/api/v1/time-entries/${entryId}/stop`)
      .set("Authorization", `Bearer ${techToken}`)
      .send({ endTime, breakMinutes: 0, description: "Repair work done" });
    expect(stopRes.status).toBe(200);
    expect(stopRes.body.data.durationMinutes).toBeGreaterThan(0);

    const submitRes = await request(app)
      .post(`/api/v1/time-entries/${entryId}/submit`)
      .set("Authorization", `Bearer ${techToken}`);
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.status).toBe("submitted");
  });

  test("Leader can view queue and approve time entry", async () => {
    const queueRes = await request(app)
      .get("/api/v1/time-entries/queue")
      .set("Authorization", `Bearer ${leaderToken}`);
    expect(queueRes.status).toBe(200);
    expect(queueRes.body.data.some((e) => e.id === entryId)).toBe(true);

    const approveRes = await request(app)
      .post(`/api/v1/time-entries/${entryId}/approve`)
      .set("Authorization", `Bearer ${leaderToken}`)
      .send({ leaderNotes: "Looks good" });
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe("approved");
  });

  test("Audit log records status changes", async () => {
    const logs = await prisma.auditLog.findMany({
      where: { companyId, entityType: "time_entry", entityId: entryId },
      orderBy: { createdAt: "asc" },
    });
    const actions = logs.map((l) => l.action);
    expect(actions).toContain("create");
    expect(actions).toContain("submit");
    expect(actions).toContain("approve");
  });

  test("Machine and task history endpoints return entries", async () => {
    const machineHistory = await request(app)
      .get(`/api/v1/machines/${machineId}/time-entries`)
      .set("Authorization", `Bearer ${leaderToken}`);
    expect(machineHistory.status).toBe(200);
    expect(machineHistory.body.data.some((e) => e.id === entryId)).toBe(true);

    const taskHistory = await request(app)
      .get(`/api/v1/tasks/${taskId}/time-entries`)
      .set("Authorization", `Bearer ${leaderToken}`);
    expect(taskHistory.status).toBe(200);
    expect(taskHistory.body.data.some((e) => e.id === entryId)).toBe(true);
  });

  test("Leader can reject and request correction on submitted entries", async () => {
    const startRes = await request(app)
      .post("/api/v1/time-entries/start")
      .set("Authorization", `Bearer ${techToken}`)
      .send({ machineId, description: "Second entry" });
    const id = startRes.body.data.id;

    await request(app)
      .post(`/api/v1/time-entries/${id}/stop`)
      .set("Authorization", `Bearer ${techToken}`)
      .send({
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });

    await request(app)
      .post(`/api/v1/time-entries/${id}/submit`)
      .set("Authorization", `Bearer ${techToken}`);

    const rejectRes = await request(app)
      .post(`/api/v1/time-entries/${id}/reject`)
      .set("Authorization", `Bearer ${leaderToken}`)
      .send({ leaderNotes: "Wrong machine" });
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.status).toBe("rejected");

    const start2 = await request(app)
      .post("/api/v1/time-entries/start")
      .set("Authorization", `Bearer ${techToken}`)
      .send({ machineId });
    const id2 = start2.body.data.id;
    await request(app).post(`/api/v1/time-entries/${id2}/stop`).set("Authorization", `Bearer ${techToken}`).send({ endTime: futureEndTime() });
    await request(app).post(`/api/v1/time-entries/${id2}/submit`).set("Authorization", `Bearer ${techToken}`);

    const correctionRes = await request(app)
      .post(`/api/v1/time-entries/${id2}/request-correction`)
      .set("Authorization", `Bearer ${leaderToken}`)
      .send({ leaderNotes: "Please add parts" });
    expect(correctionRes.status).toBe(200);
    expect(correctionRes.body.data.status).toBe("correction_requested");
  });

  test("Admin can override entry with audit reason", async () => {
    const overrideRes = await request(app)
      .patch(`/api/v1/time-entries/${entryId}/admin`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Correcting billable minutes", billableMinutes: 30 });
    expect(overrideRes.status).toBe(200);

    const audit = await prisma.auditLog.findFirst({
      where: {
        companyId,
        entityType: "time_entry",
        entityId: entryId,
        action: "update",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(audit?.details?.override).toBe(true);
    expect(audit?.details?.reason).toBe("Correcting billable minutes");
  });

  test("Technician cannot approve own entry", async () => {
    const startRes = await request(app)
      .post("/api/v1/time-entries/start")
      .set("Authorization", `Bearer ${techToken}`)
      .send({ machineId });
    const id = startRes.body.data.id;
    await request(app).post(`/api/v1/time-entries/${id}/stop`).set("Authorization", `Bearer ${techToken}`).send({ endTime: futureEndTime() });
    await request(app).post(`/api/v1/time-entries/${id}/submit`).set("Authorization", `Bearer ${techToken}`);

    const res = await request(app)
      .post(`/api/v1/time-entries/${id}/approve`)
      .set("Authorization", `Bearer ${techToken}`);
    expect(res.status).toBe(403);
  });
});
