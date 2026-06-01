const { request } = require("./_helpers");

request("/api/auth/signin", {
  method: "POST",
  body: JSON.stringify({
    email: process.env.TEST_EMAIL,
    password: process.env.TEST_PASSWORD
  })
});
