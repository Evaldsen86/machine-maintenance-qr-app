const request = require("supertest");

const RUN_DB_TESTS =
  process.env.RUN_PHASE6A_DB_TESTS === "true" &&
  Boolean(process.env.DATABASE_URL) &&
  Boolean(process.env.JWT_SECRET);

describe("Phase 6A Prisma API (integration)", () => {
  if (!RUN_DB_TESTS) {
    test("skipped (set RUN_PHASE6A_DB_TESTS=true and configure DATABASE_URL/JWT_SECRET)", () => {
      expect(true).toBe(true);
    });
    return;
  }

  const { app } = require("../src/app");
  const { prisma } = require("../src/lib/prisma");

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@maskiina.local").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

  let token;
  let machineId;
  let qrToken;

  beforeAll(async () => {
    await prisma.$connect();

    // Seed initial company + admin (idempotent).
    const { execSync } = require("child_process");
    execSync("node src/scripts/seed.js", { cwd: __dirname + "/.." });

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: adminEmail,
      password: adminPassword,
    });

    token = loginRes.body?.token;
    expect(token).toBeTruthy();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Reject write without auth", async () => {
    const res = await request(app)
      .post("/api/v1/machines")
      .send({
        name: "NoAuth Machine",
        model: "Test Model",
        serialNumber: "NOAUTH-1",
        specifications: { foo: "bar" },
      });

    expect(res.status).toBe(401);
  });

  test("Admin can create/read/update/soft-delete machines (tenant scoped)", async () => {
    const createRes = await request(app)
      .post("/api/v1/machines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Machine",
        model: "Test Model",
        serialNumber: "TEST-PRISMA-1",
        specifications: { engine: "V8" },
        status: "active",
      });

    expect(createRes.status).toBe(201);
    machineId = createRes.body?.data?.id;
    expect(machineId).toBeTruthy();

    const readRes = await request(app)
      .get(`/api/v1/machines/${machineId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(readRes.status).toBe(200);

    const updateRes = await request(app)
      .patch(`/api/v1/machines/${machineId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Updated description" });
    expect(updateRes.status).toBe(200);

    const deleteRes = await request(app)
      .delete(`/api/v1/machines/${machineId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleteRes.status).toBe(204);

    const readAfterDelete = await request(app)
      .get(`/api/v1/machines/${machineId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(readAfterDelete.status).toBe(404);
  });

  test("QR lookup works through API", async () => {
    const machineCreateRes = await request(app)
      .post("/api/v1/machines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "QR Machine",
        model: "Test Model",
        serialNumber: "QR-PRISMA-" + Date.now(),
        specifications: { engine: "V8" },
        status: "active",
      });

    expect(machineCreateRes.status).toBe(201);
    machineId = machineCreateRes.body?.data?.id;

    qrToken = "qr-token-2-" + Date.now();

    const createRes = await request(app)
      .post("/api/v1/qr-codes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        machineId,
        qrToken,
        publicSlug: "machine-" + machineId.slice(0, 8),
      });
    expect(createRes.status).toBe(201);

    const validateRes = await request(app)
      .post("/api/v1/qr-codes/validate")
      .set("Authorization", `Bearer ${token}`)
      .send({ qrToken });

    expect(validateRes.status).toBe(200);
    expect(validateRes.body?.data?.machine?.id).toBe(machineId);
  });
});

