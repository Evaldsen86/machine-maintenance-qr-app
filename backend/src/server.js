require("./config/env");
const { app } = require("./app");
const { prisma } = require("./lib/prisma");

const port = Number(process.env.PORT || process.env.BACKEND_PORT || 3000);

const bootstrap = async () => {
  await prisma.$connect();
  app.listen(port, () => {
    console.log(`Phase 6A backend listening on port ${port}`);
  });
};

bootstrap().catch((err) => {
  console.error("Failed to start Phase 6A backend:", err);
  process.exit(1);
});

