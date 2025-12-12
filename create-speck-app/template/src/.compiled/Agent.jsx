// ⚠️ BUILT-IN SPECK COMPONENT
// Agent component for AI interactions

import { h } from "preact";
import { signal } from "@preact/signals";
import { SpeckAgent } from "../lib/agent-runtime.js";

export default function Agent(props) {
  const {
    purpose = "AI Assistant",
    model = "gpt-4",
    temperature = 0.7,
    maxTokens = 1000,
    provider = "openai",
    apiKey,
    streaming = true,
    systemPrompt,
    tools = [],
    onResponse,
    onError,
    onStream,
    children,
  } = props;

  // Signals for fine-grained reactivity
  const agent = signal(null);
  const response = signal("");
  const loading = signal(false);
  const error = signal(null);
  const history = signal([]);

  // Initialize agent
  if (!agent.value) {
    agent.value = new SpeckAgent({
      purpose,
      model,
      temperature,
      maxTokens,
      provider,
      apiKey,
      streaming,
      systemPrompt,
      tools,
    });
  }

  const send = async (message, options = {}) => {
    loading.value = true;
    error.value = null;
    response.value = "";

    try {
      const result = await agent.value.send(message, {
        history: history.value,
        onChunk: streaming
          ? (chunk) => {
              response.value += chunk;
              onStream?.(chunk, response.value);
            }
          : undefined,
        ...options,
      });

      response.value = result.content;
      history.value = [
        ...history.value,
        { role: "user", content: message },
        { role: "assistant", content: result.content },
      ];

      onResponse?.(result);
      return result;
    } catch (err) {
      error.value = err.message;
      onError?.(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    response.value = "";
    error.value = null;
    history.value = [];
  };

  // Provide agent context to children
  if (children) {
    return children({
      send,
      reset,
      response: response.value,
      loading: loading.value,
      error: error.value,
      history: history.value,
      agent: agent.value,
    });
  }

  return null;
}
