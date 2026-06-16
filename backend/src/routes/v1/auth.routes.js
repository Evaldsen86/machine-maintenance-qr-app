const express = require("express");
const bcrypt = require("bcryptjs");
const { prisma } = require("../../lib/prisma");
const { signAccessToken } = require("../../utils/jwt");
const { ApiError } = require("../../utils/apiError");
const { asyncHandler } = require("../../middleware/asyncHandler");
const { validate } = require("../../middleware/validate");
const { loginBodySchema } = require("../../validators/authSchemas");

const router = express.Router();

router.post(
  "/login",
  validate({ body: loginBodySchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null, status: "active" },
    });

    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new ApiError(401, "Invalid credentials");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signAccessToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        companyId: user.companyId,
        isCompanyAdmin: user.isCompanyAdmin,
      },
    });
  })
);

module.exports = router;

