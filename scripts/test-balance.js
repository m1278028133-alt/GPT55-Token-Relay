const { request } = require("./_helpers");

request("/api/user/balance", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${process.env.TEST_USER_TOKEN}`
  }
});
