const { request } = require("./_helpers");

request("/api/user/api-keys", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.TEST_USER_TOKEN}`
  },
  body: JSON.stringify({ name: "Local test key" })
});
