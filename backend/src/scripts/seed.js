require("../config/env");
const bcrypt = require("bcryptjs");
const { prisma } = require("../lib/prisma");

const ADMIN_ROLE_CODE = "admin";

const run = async () => {
  const companySlug = process.env.SEED_COMPANY_SLUG || "default-company";
  const companyName = process.env.SEED_COMPANY_NAME || "Maskiina Internal";
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@maskiina.local").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const adminName = process.env.SEED_ADMIN_NAME || "Initial Admin";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const company = await prisma.company.upsert({
    where: { slug: companySlug },
    update: { name: companyName, deletedAt: null },
    create: {
      slug: companySlug,
      name: companyName,
      status: "active",
    },
  });

  const role = await prisma.role.upsert({
    where: {
      companyId_code: {
        companyId: company.id,
        code: ADMIN_ROLE_CODE,
      },
    },
    update: {
      name: "Administrator",
      description: "Company administrator with full access",
      deletedAt: null,
      isSystem: true,
    },
    create: {
      companyId: company.id,
      code: ADMIN_ROLE_CODE,
      name: "Administrator",
      description: "Company administrator with full access",
      isSystem: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: {
      companyId_email: {
        companyId: company.id,
        email: adminEmail,
      },
    },
    update: {
      fullName: adminName,
      passwordHash,
      status: "active",
      isCompanyAdmin: true,
      deletedAt: null,
    },
    create: {
      companyId: company.id,
      email: adminEmail,
      fullName: adminName,
      passwordHash,
      status: "active",
      isCompanyAdmin: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      companyId_userId_roleId_permissionId: {
        companyId: company.id,
        userId: admin.id,
        roleId: role.id,
        permissionId: null,
      },
    },
    update: {},
    create: {
      companyId: company.id,
      userId: admin.id,
      roleId: role.id,
      permissionId: null,
    },
  });

  console.log("Seed complete");
  console.log(`Company: ${company.name} (${company.slug})`);
  console.log(`Admin email: ${admin.email}`);
  console.log("Admin password is from SEED_ADMIN_PASSWORD environment variable");
};

run()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

