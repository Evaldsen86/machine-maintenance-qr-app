require("../config/env");
const bcrypt = require("bcryptjs");
const { prisma } = require("../lib/prisma");

const ADMIN_ROLE_CODE = "admin";
const LEADER_ROLE_CODE = "leader";
const TECHNICIAN_ROLE_CODE = "technician";

const upsertRole = async (companyId, code, name, description) =>
  prisma.role.upsert({
    where: { companyId_code: { companyId, code } },
    update: { name, description, deletedAt: null, isSystem: true },
    create: { companyId, code, name, description, isSystem: true },
  });

const upsertUserWithRole = async ({ companyId, roleId, email, fullName, passwordHash, isCompanyAdmin = false }) => {
  const user = await prisma.user.upsert({
    where: { companyId_email: { companyId, email } },
    update: {
      fullName,
      passwordHash,
      status: "active",
      isCompanyAdmin,
      deletedAt: null,
    },
    create: {
      companyId,
      email,
      fullName,
      passwordHash,
      status: "active",
      isCompanyAdmin,
    },
  });

  await prisma.userRole.upsert({
    where: {
      companyId_userId_roleId_permissionId: {
        companyId,
        userId: user.id,
        roleId,
        permissionId: null,
      },
    },
    update: {},
    create: { companyId, userId: user.id, roleId, permissionId: null },
  });

  return user;
};

const run = async () => {
  const companySlug = process.env.SEED_COMPANY_SLUG || "default-company";
  const companyName = process.env.SEED_COMPANY_NAME || "Maskiina Internal";
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@maskiina.local").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const adminName = process.env.SEED_ADMIN_NAME || "Initial Admin";
  const leaderEmail = (process.env.SEED_LEADER_EMAIL || "leader@maskiina.local").toLowerCase();
  const leaderPassword = process.env.SEED_LEADER_PASSWORD || "ChangeMe123!";
  const leaderName = process.env.SEED_LEADER_NAME || "Workshop Leader";
  const techEmail = (process.env.SEED_TECH_EMAIL || "tech@maskiina.local").toLowerCase();
  const techPassword = process.env.SEED_TECH_PASSWORD || "ChangeMe123!";
  const techName = process.env.SEED_TECH_NAME || "Test Technician";

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const leaderPasswordHash = await bcrypt.hash(leaderPassword, 12);
  const techPasswordHash = await bcrypt.hash(techPassword, 12);

  const company = await prisma.company.upsert({
    where: { slug: companySlug },
    update: { name: companyName, deletedAt: null },
    create: {
      slug: companySlug,
      name: companyName,
      status: "active",
    },
  });

  const role = await upsertRole(company.id, ADMIN_ROLE_CODE, "Administrator", "Company administrator with full access");
  const leaderRole = await upsertRole(company.id, LEADER_ROLE_CODE, "Leader", "Workshop leader — approves time entries");
  const techRole = await upsertRole(
    company.id,
    TECHNICIAN_ROLE_CODE,
    "Technician",
    "Technician — registers and submits time"
  );

  const admin = await upsertUserWithRole({
    companyId: company.id,
    roleId: role.id,
    email: adminEmail,
    fullName: adminName,
    passwordHash,
    isCompanyAdmin: true,
  });

  const leader = await upsertUserWithRole({
    companyId: company.id,
    roleId: leaderRole.id,
    email: leaderEmail,
    fullName: leaderName,
    passwordHash: leaderPasswordHash,
  });

  const technician = await upsertUserWithRole({
    companyId: company.id,
    roleId: techRole.id,
    email: techEmail,
    fullName: techName,
    passwordHash: techPasswordHash,
  });

  console.log("Seed complete");
  console.log(`Company: ${company.name} (${company.slug})`);
  console.log(`Admin email: ${admin.email}`);
  console.log(`Leader email: ${leader.email}`);
  console.log(`Technician email: ${technician.email}`);
  console.log("Passwords are from SEED_*_PASSWORD environment variables");
};

run()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

