// Simple proxy server for Anthropic API
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { messages, model, temperature, max_tokens, stream } = req.body;

  const apiKey = process.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const systemMessage =
      messages.find((m) => m.role === "system")?.content || "";
    const conversationMessages = messages.filter((m) => m.role !== "system");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model, // Use model from request - no default
        system: systemMessage,
        messages: conversationMessages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 1000,
        stream: stream || false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json(error);
    }

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          res.write(chunk);
        }
      } finally {
        reader.releaseLock();
      }

      res.end();
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
});
