const { request } = require("./_helpers");

const email = process.env.TEST_EMAIL || `user-${Date.now()}@example.com`;
const password = process.env.TEST_PASSWORD || "ChangeMe123!";

request("/api/auth/signup", {
  method: "POST",
  body: JSON.stringify({ email, password })
});
