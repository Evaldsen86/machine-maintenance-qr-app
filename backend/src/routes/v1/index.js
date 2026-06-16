const express = require("express");
const authRoutes = require("./auth.routes");
const companyRoutes = require("./companies.routes");
const userRoutes = require("./users.routes");
const roleRoutes = require("./roles.routes");
const machineRoutes = require("./machines.routes");
const qrCodesRoutes = require("./qrCodes.routes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "Phase 6A API is running" });
});

router.use("/auth", authRoutes);
router.use("/companies", companyRoutes);
router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/machines", machineRoutes);
router.use("/qr-codes", qrCodesRoutes);

module.exports = router;

