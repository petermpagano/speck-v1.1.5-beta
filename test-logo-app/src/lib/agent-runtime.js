// Agent Runtime for Speck.js
// Handles LLM API calls and agent orchestration

export class SpeckAgent {
  constructor(config) {
    this.purpose = config.purpose || "General AI assistant";
    this.model = config.model || "gpt-4";
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens || 1000;
    this.systemPrompt = config.systemPrompt || this.purpose;
    this.apiKey = config.apiKey || this.getApiKeyFromEnv();
    this.provider = config.provider || "openai"; // openai, anthropic, ollama
    this.streaming = config.streaming ?? true;
    this.tools = config.tools || [];
    this.context = config.context || {};
  }

  getApiKeyFromEnv() {
    // Try to get from window (for client-side .env injection)
    if (typeof window !== "undefined" && window.__SPECK_AGENT_CONFIG__) {
      return window.__SPECK_AGENT_CONFIG__.apiKey;
    }
    // Try to get from import.meta.env (Vite)
    if (typeof import.meta !== "undefined" && import.meta.env) {
      return (
        import.meta.env.VITE_OPENAI_API_KEY ||
        import.meta.env.VITE_ANTHROPIC_API_KEY ||
        import.meta.env.VITE_AGENT_API_KEY
      );
    }
    return null;
  }

  async send(message, options = {}) {
    if (!this.apiKey) {
      throw new Error(
        "Agent API key not configured. Set VITE_ANTHROPIC_API_KEY in your .env file"
      );
    }

    const messages = [
      { role: "system", content: this.systemPrompt },
      ...(options.history || []),
      { role: "user", content: message },
    ];

    // Speck.js currently only supports Anthropic
    return this.sendAnthropic(messages, options);
  }

  async sendOpenAI(messages, options) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: this.streaming && options.onChunk,
        tools: this.tools.length > 0 ? this.tools : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenAI API Error: ${error.error?.message || "Unknown error"}`
      );
    }

    if (this.streaming && options.onChunk) {
      return this.handleOpenAIStream(response, options.onChunk);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      role: "assistant",
      model: data.model,
      usage: data.usage,
    };
  }

  async handleOpenAIStream(response, onChunk) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return { content: fullContent, role: "assistant" };
  }

  async sendAnthropic(messages, options) {
    // Use local proxy to avoid CORS issues
    const response = await fetch("http://localhost:3001/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        model: this.model,

        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: this.streaming && options.onChunk,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Anthropic API Error: ${error.error?.message || "Unknown error"}`
      );
    }

    if (this.streaming && options.onChunk) {
      return this.handleAnthropicStream(response, options.onChunk);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      role: "assistant",
      model: data.model,
      usage: data.usage,
    };
  }

  async handleAnthropicStream(response, onChunk) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                fullContent += parsed.delta.text;
                onChunk(parsed.delta.text);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return { content: fullContent, role: "assistant" };
  }

  async sendOllama(messages, options) {
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: this.streaming && options.onChunk,
        options: {
          temperature: this.temperature,
          num_predict: this.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.statusText}`);
    }

    if (this.streaming && options.onChunk) {
      return this.handleOllamaStream(response, options.onChunk);
    }

    const data = await response.json();
    return {
      content: data.message.content,
      role: "assistant",
      model: data.model,
    };
  }

  async handleOllamaStream(response, onChunk) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              fullContent += parsed.message.content;
              onChunk(parsed.message.content);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return { content: fullContent, role: "assistant" };
  }
}
