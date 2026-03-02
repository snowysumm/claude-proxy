const express = require("express");
const axios = require("axios");
require("dotenv").config();
const rateLimit = require("express-rate-limit");

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
const limiter = rateLimit({
  windowMs: 60 * 1000,   // 1 分鐘
  max: 30                // 每分鐘最多 30 次
});

app.use(limiter);

app.post("/v1/chat/completions", async (req, res) => {
  try {
    const { messages, max_tokens = 1000 } = req.body;

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-5-20250929",
        max_tokens,
        messages
      },
      {
        headers: {
          "x-api-key": process.env.CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        }
      }
    );

    const text = response.data.content[0].text;

    res.json({
      id: "chatcmpl-" + Date.now(),
      object: "chat.completion",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: text },
          finish_reason: "stop"
        }
      ]
    });

  } catch (err) {
    res.status(500).json({
      error: err.response?.data || err.message
    });
  }
});

app.get("/", (req, res) => {
  res.send("Claude proxy running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});