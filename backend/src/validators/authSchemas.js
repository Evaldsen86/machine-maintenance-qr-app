const { z } = require("./common");

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

module.exports = { loginBodySchema };

