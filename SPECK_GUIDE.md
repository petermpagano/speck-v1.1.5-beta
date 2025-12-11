# Speck.js Developer Guide

## 🚀 What's New

This version of Speck.js includes three major improvements:

### 1. ✅ Fixed `<script>` Tag
Component logic inside `<script>` tags now works properly without breaking.

### 2. ✅ Fine-Grained Reactivity with Signals
Replaced Valtio with Preact Signals for better performance and simpler reactivity.

### 3. ✅ Built-in `<Agent>` Component
Create AI-powered components with zero configuration.

---

## 🎯 Using State with Signals

### Declaring State
```jsx
<MyComponent>
  <state count={0} />
  <state name={"John"} />
  <state items={[]} />
```

### Accessing & Updating State
Always use `.value` to read or write:

```jsx
<script>
  function increment() {
    state.count.value++;
  }
  
  function updateName(newName) {
    state.name.value = newName;
  }
</script>
```

### In JSX
```jsx
<div>
  <p>Count: {state.count.value}</p>
  <p>Name: {state.name.value}</p>
  <button onClick={increment}>Increment</button>
</div>
```

---

## 🤖 Using the Agent Component

### Step 1: Setup API Keys

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Add your API key:
```env
VITE_OPENAI_API_KEY=sk-your-actual-key-here
```

### Step 2: Use in Components

```jsx
<ChatApp>
  <state userInput={""} />
  
  <Agent
    purpose="You are a helpful assistant"
    model="gpt-4"
    provider="openai"
    streaming={true}
  >
    {({ send, response, loading, error, history }) => (
      <div>
        <input 
          value={state.userInput.value}
          onChange={(e) => state.userInput.value = e.target.value}
        />
        
        <button 
          onClick={() => send(state.userInput.value)}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send"}
        </button>
        
        <if condition={error}>
          <p style="color: red">Error: {error}</p>
        </if>
        
        <div>
          <h3>Response:</h3>
          <p>{response}</p>
        </div>
      </div>
    )}
  </Agent>
</ChatApp>;
```

### Agent Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `purpose` | string | "AI Assistant" | System prompt for the agent |
| `model` | string | "gpt-4" | Model to use (gpt-4, gpt-3.5-turbo, claude-3, etc) |
| `provider` | string | "openai" | API provider (openai, anthropic, ollama) |
| `temperature` | number | 0.7 | Response randomness (0-1) |
| `maxTokens` | number | 1000 | Maximum response length |
| `streaming` | boolean | true | Enable streaming responses |
| `apiKey` | string | from env | Override API key |
| `onResponse` | function | - | Callback when response completes |
| `onError` | function | - | Callback on error |
| `onStream` | function | - | Callback for each chunk |

### Render Props

The `<Agent>` component uses render props pattern:

```jsx
{({ send, reset, response, loading, error, history, agent }) => (
  // Your UI here
)}
```

| Prop | Type | Description |
|------|------|-------------|
| `send(message)` | function | Send a message to the agent |
| `reset()` | function | Clear conversation history |
| `response` | string | Current response from agent |
| `loading` | boolean | Is the agent processing? |
| `error` | string | Error message if any |
| `history` | array | Conversation history |
| `agent` | object | Direct access to agent instance |

---

## 🎨 Example: Complete Chat Component

```jsx
<AIChatbot>
  <state messages={[]} />
  <state input={""} />
  
  <script>
    function addMessage(role, content) {
      state.messages.value = [
        ...state.messages.value,
        { role, content, timestamp: Date.now() }
      ];
    }
    
    function handleSend(send) {
      if (!state.input.value.trim()) return;
      
      addMessage("user", state.input.value);
      send(state.input.value);
      state.input.value = "";
    }
  </script>
  
  <div class="chat-container">
    <h1>AI Chatbot</h1>
    
    <Agent
      purpose="You are a friendly AI assistant"
      model="gpt-4"
      onResponse={(result) => addMessage("assistant", result.content)}
    >
      {({ send, loading }) => (
        <div>
          <div class="messages">
            <loop of={state.messages.value} let={msg}>
              <div class={`message ${msg.role}`}>
                <strong>{msg.role}:</strong> {msg.content}
              </div>
            </loop>
          </div>
          
          <div class="input-area">
            <input
              type="text"
              value={state.input.value}
              onChange={(e) => state.input.value = e.target.value}
              onKeyPress={(e) => e.key === 'Enter' && handleSend(send)}
              placeholder="Type a message..."
            />
            
            <button 
              onClick={() => handleSend(send)}
              disabled={loading}
            >
              {loading ? "⏳" : "Send"}
            </button>
          </div>
        </div>
      )}
    </Agent>
  </div>
</AIChatbot>;
```

---

## 🔧 Supported AI Providers

### OpenAI
```jsx
<Agent
  provider="openai"
  model="gpt-4"
  apiKey={import.meta.env.VITE_OPENAI_API_KEY}
/>
```

### Anthropic (Claude)
```jsx
<Agent
  provider="anthropic"
  model="claude-3-opus-20240229"
  apiKey={import.meta.env.VITE_ANTHROPIC_API_KEY}
/>
```

### Ollama (Local)
```jsx
<Agent
  provider="ollama"
  model="llama2"
  // No API key needed - runs locally
/>
```

---

## 📝 Tips & Best Practices

### 1. Always Use `.value` with Signals
```jsx
// ✅ Correct
state.count.value++

// ❌ Wrong
state.count++
```

### 2. Script Tag on One Line (for now)
```jsx
// ✅ Works
<script>function inc() { state.count.value++; }</script>

// ❌ May have issues (being fixed)
<script>
  function inc() {
    state.count.value++;
  }
</script>
```

### 3. Use onClick (camelCase)
```jsx
// ✅ Correct
<button onClick={handleClick}>Click</button>

// ❌ Wrong (old HTML)
<button onclick={handleClick}>Click</button>
```

### 4. Agent Streaming
For better UX, enable streaming:
```jsx
<Agent streaming={true} onStream={(chunk) => console.log(chunk)}>
```

---

## 🐛 Troubleshooting

### "Agent API key not configured"
Make sure you have a `.env` file with your API key:
```bash
cp .env.example .env
# Edit .env and add your key
```

### State not updating
Remember to use `.value`:
```jsx
state.myVar.value = newValue;  // ✅
```

### Script tag errors
Keep script logic on one line for now, or use semicolons:
```jsx
<script>const x = 1; function y() { return x; }</script>
```

---

## 🎓 More Examples

Check out the `/src/components/` folder for examples:
- `SignalsDemo.speck` - State management
- `App.speck` - Basic component structure
- More coming soon!

---

## 📚 Need Help?

The Speck.js language is designed to be intuitive for both humans and AI. If you're stuck, try describing what you want in plain English - chances are, an AI can help you write it!
