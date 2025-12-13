// ⚠️ SPECK.JS BUILT-IN COMPONENT
// Agent Component System - Declarative AI for SpeckJS
// Usage: <Agent.Chat purpose="..." /> or compound <Agent><Agent.Input />...</Agent>

import { h, createContext } from 'preact';
import { useContext, useState, useCallback, useRef } from 'preact/hooks';

// Context to share agent state with sub-components
const AgentContext = createContext(null);

// =============================================================================
// CORE: SpeckAgent Class (Client-side wrapper)
// =============================================================================
class SpeckAgentClient {
  constructor(config) {
    this.purpose = config.purpose || "You are a helpful AI assistant.";
    this.model = config.model || "claude-sonnet-4-20250514";
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens || 1000;
    this.provider = config.provider || "anthropic";
    this.streaming = config.streaming ?? true;
  }

  async send(message, options = {}) {
    const messages = [
      { role: "system", content: this.purpose },
      ...(options.history || []),
      { role: "user", content: message },
    ];

    const response = await fetch("http://localhost:3001/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: this.streaming && !!options.onChunk,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "API request failed");
    }

    if (this.streaming && options.onChunk) {
      return this.handleStream(response, options.onChunk);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      role: "assistant",
    };
  }

  async handleStream(response, onChunk) {
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
            try {
              const parsed = JSON.parse(line.slice(6));
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
}

// =============================================================================
// HOOK: useAgent - Internal state management
// =============================================================================
function useAgent(config) {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  
  const agentRef = useRef(null);
  
  if (!agentRef.current) {
    agentRef.current = new SpeckAgentClient(config);
  }

  const send = useCallback(async (message) => {
    if (!message?.trim()) return;
    
    setLoading(true);
    setError(null);
    setResponse("");

    try {
      const result = await agentRef.current.send(message, {
        history,
        onChunk: config.streaming !== false ? (chunk) => {
          setResponse((prev) => prev + chunk);
        } : undefined,
      });

      if (config.streaming === false) {
        setResponse(result.content);
      }

      // Update history
      setHistory((prev) => [
        ...prev,
        { role: "user", content: message },
        { role: "assistant", content: result.content },
      ]);

      // Callback
      if (config.onResponse) {
        config.onResponse(result.content);
      }

      setInput("");
    } catch (err) {
      setError(err.message);
      if (config.onError) {
        config.onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [history, config]);

  const clear = useCallback(() => {
    setHistory([]);
    setResponse("");
    setError(null);
  }, []);

  return {
    send,
    clear,
    response,
    loading,
    error,
    history,
    input,
    setInput,
  };
}

// =============================================================================
// COMPOUND COMPONENTS
// =============================================================================

// Agent.Input - Text input field
function AgentInput({ placeholder = "Type a message...", className = "", style = {} }) {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("<Agent.Input> must be used inside <Agent>");

  const defaultStyle = {
    width: "100%",
    padding: "12px",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    ...style,
  };

  return (
    <input
      type="text"
      value={ctx.input}
      onInput={(e) => ctx.setInput(e.target.value)}
      onKeyPress={(e) => e.key === "Enter" && !ctx.loading && ctx.send(ctx.input)}
      placeholder={placeholder}
      disabled={ctx.loading}
      className={className}
      style={defaultStyle}
    />
  );
}

// Agent.Submit - Submit button
function AgentSubmit({ 
  children = "Send", 
  loadingText = "Thinking...",
  className = "", 
  style = {} 
}) {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("<Agent.Submit> must be used inside <Agent>");

  const defaultStyle = {
    padding: "12px 24px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: ctx.loading ? "not-allowed" : "pointer",
    opacity: ctx.loading ? 0.6 : 1,
    ...style,
  };

  return (
    <button
      onClick={() => ctx.send(ctx.input)}
      disabled={ctx.loading}
      className={className}
      style={defaultStyle}
    >
      {ctx.loading ? loadingText : children}
    </button>
  );
}

// Agent.Loading - Loading indicator (only shown when loading)
function AgentLoading({ children = "Thinking...", className = "", style = {} }) {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("<Agent.Loading> must be used inside <Agent>");

  if (!ctx.loading) return null;

  const defaultStyle = {
    padding: "12px",
    color: "#7c3aed",
    fontStyle: "italic",
    ...style,
  };

  return (
    <div className={className} style={defaultStyle}>
      {children}
    </div>
  );
}

// Agent.Error - Error display (only shown when error exists)
function AgentError({ className = "", style = {} }) {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("<Agent.Error> must be used inside <Agent>");

  if (!ctx.error) return null;

  const defaultStyle = {
    padding: "12px",
    background: "#fee2e2",
    border: "2px solid #ef4444",
    borderRadius: "8px",
    color: "#991b1b",
    ...style,
  };

  return (
    <div className={className} style={defaultStyle}>
      <strong>Error:</strong> {ctx.error}
    </div>
  );
}

// Agent.Response - Response display (only shown when response exists)
function AgentResponse({ render, className = "", style = {} }) {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("<Agent.Response> must be used inside <Agent>");

  if (!ctx.response) return null;

  const defaultStyle = {
    padding: "16px",
    background: "#f3f4f6",
    border: "2px solid #7c3aed",
    borderRadius: "8px",
    whiteSpace: "pre-wrap",
    lineHeight: 1.6,
    ...style,
  };

  // Custom render function support
  if (render) {
    return (
      <div className={className} style={defaultStyle}>
        {render(ctx.response)}
      </div>
    );
  }

  return (
    <div className={className} style={defaultStyle}>
      {ctx.response}
    </div>
  );
}

// Agent.History - Chat history display
function AgentHistory({ className = "", style = {} }) {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("<Agent.History> must be used inside <Agent>");

  if (ctx.history.length === 0) return null;

  const defaultStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    ...style,
  };

  const messageStyle = (role) => ({
    padding: "12px",
    borderRadius: "8px",
    background: role === "user" ? "#e0e7ff" : "#f3f4f6",
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    maxWidth: "80%",
  });

  return (
    <div className={className} style={defaultStyle}>
      {ctx.history.map((msg, idx) => (
        <div key={idx} style={messageStyle(msg.role)}>
          <strong>{msg.role === "user" ? "You" : "Assistant"}:</strong>
          <p style={{ margin: "8px 0 0 0", whiteSpace: "pre-wrap" }}>{msg.content}</p>
        </div>
      ))}
    </div>
  );
}

// Agent.Clear - Clear history button
function AgentClear({ children = "Clear", className = "", style = {} }) {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("<Agent.Clear> must be used inside <Agent>");

  const defaultStyle = {
    padding: "8px 16px",
    background: "#f3f4f6",
    color: "#666",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
    ...style,
  };

  return (
    <button onClick={ctx.clear} className={className} style={defaultStyle}>
      {children}
    </button>
  );
}

// =============================================================================
// MAIN: Agent Provider Component
// =============================================================================
function Agent({ 
  purpose = "You are a helpful AI assistant.",
  model = "claude-sonnet-4-20250514",
  temperature = 0.7,
  maxTokens = 1000,
  provider = "anthropic",
  streaming = true,
  onResponse,
  onError,
  children,
  className = "",
  style = {},
}) {
  const agent = useAgent({
    purpose,
    model,
    temperature,
    maxTokens,
    provider,
    streaming,
    onResponse,
    onError,
  });

  const defaultStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    ...style,
  };

  return (
    <AgentContext.Provider value={agent}>
      <div className={className} style={defaultStyle}>
        {children}
      </div>
    </AgentContext.Provider>
  );
}

// =============================================================================
// PRESETS: One-liner components
// =============================================================================

// Agent.Chat - Full chat UI in one line
function AgentChat({
  purpose = "You are a helpful AI assistant.",
  model = "claude-sonnet-4-20250514",
  temperature = 0.7,
  maxTokens = 1000,
  provider = "anthropic",
  streaming = true,
  placeholder = "Type a message...",
  submitLabel = "Send",
  loadingText = "Thinking...",
  showHistory = true,
  onResponse,
  onError,
  className = "",
  style = {},
}) {
  return (
    <Agent
      purpose={purpose}
      model={model}
      temperature={temperature}
      maxTokens={maxTokens}
      provider={provider}
      streaming={streaming}
      onResponse={onResponse}
      onError={onError}
      className={className}
      style={style}
    >
      {showHistory && <AgentHistory />}
      <AgentError />      
      <div style={{ display: "flex", gap: "8px" }}>
        <div style={{ flex: 1 }}>
          <AgentInput placeholder={placeholder} />
        </div>
        <AgentSubmit loadingText={loadingText}>{submitLabel}</AgentSubmit>
      </div>
    </Agent>
  );
}

// Agent.Ask - Single prompt/response (no chat history)
function AgentAsk({
  purpose = "You are a helpful AI assistant.",
  model = "claude-sonnet-4-20250514",
  prompt,
  onResponse,
  onError,
  autoSend = true,
  children,
  className = "",
  style = {},
}) {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const sentRef = useRef(false);

  const agent = useRef(new SpeckAgentClient({ purpose, model }));

  const send = useCallback(async (message) => {
    setLoading(true);
    setError(null);
    try {
      const result = await agent.current.send(message, {
        onChunk: (chunk) => setResponse((prev) => prev + chunk),
      });
      if (onResponse) onResponse(result.content);
    } catch (err) {
      setError(err.message);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [onResponse, onError]);

  // Auto-send on mount if prompt provided
  if (autoSend && prompt && !sentRef.current) {
    sentRef.current = true;
    send(prompt);
  }

  // Render function children
  if (typeof children === "function") {
    return children({ send, response, loading, error });
  }

  const defaultStyle = {
    padding: "16px",
    ...style,
  };

  return (
    <div className={className} style={defaultStyle}>
      {loading && <div style={{ color: "#7c3aed" }}>Loading...</div>}
      {error && <div style={{ color: "#ef4444" }}>Error: {error}</div>}
      {response && <div style={{ whiteSpace: "pre-wrap" }}>{response}</div>}
    </div>
  );
}

// =============================================================================
// ATTACH SUB-COMPONENTS
// =============================================================================
Agent.Input = AgentInput;
Agent.Submit = AgentSubmit;
Agent.Loading = AgentLoading;
Agent.Error = AgentError;
Agent.Response = AgentResponse;
Agent.History = AgentHistory;
Agent.Clear = AgentClear;
Agent.Chat = AgentChat;
Agent.Ask = AgentAsk;

export default Agent;
export { Agent, AgentChat, AgentAsk };
