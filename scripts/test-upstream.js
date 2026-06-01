const { request } = require("./_helpers");

request("/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.TEST_API_KEY}`
  },
  body: JSON.stringify({
    model: "qwen3.5",
    messages: [{ role: "user", content: "Say hello in one short sentence." }],
    max_tokens: 80
  })
});
