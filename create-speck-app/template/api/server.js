// Local development server for Speck.js Agent API
// Run with: node api/server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getDatabase, loadMemory, saveInteraction } from "./db.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize database on startup
getDatabase();

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Memory: Load interactions
app.post("/api/memory/load", async (req, res) => {
  try {
    const { sessionId, agentId, depth } = req.body;
    const memories = await loadMemory(sessionId, agentId, depth || 5);
    res.json({ memories });
  } catch (error) {
    console.error("Memory load error:", error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// Memory: Save interaction
app.post("/api/memory/save", async (req, res) => {
  try {
    const { sessionId, agentId, role, content, type } = req.body;
    await saveInteraction(sessionId, agentId, role, content, type || "message");
    res.json({ success: true });
  } catch (error) {
    console.error("Memory save error:", error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// Chat endpoint - proxies to Anthropic
app.post("/api/chat", async (req, res) => {
  const { messages, model, temperature, max_tokens, stream } = req.body;

  // Get API key from environment
  const apiKey = process.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: {
        message:
          "API key not configured. Add VITE_ANTHROPIC_API_KEY to your .env file",
      },
    });
  }

  try {
    // Extract system message
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
        model: model || "claude-sonnet-4-20250514",
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

    // If streaming, forward the stream
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
    res.status(500).json({ error: { message: error.message } });
  }
});

app.listen(PORT, () => {
  console.log(`\n🤖 Speck.js Agent API running at http://localhost:${PORT}`);
  console.log(`   POST /api/chat - Send messages to Claude`);
  console.log(`   POST /api/memory/load - Load agent memory`);
  console.log(`   POST /api/memory/save - Save interaction\n`);
});
