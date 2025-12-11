# 🌟 Speck.js

**The AI-Native Web Framework**

Build reactive web applications with zero imports, intuitive syntax, and fine-grained reactivity. Designed for both humans and AI.

```speck
<Counter>
  <state count={0} />
  
  <script>
    const increment = () => state.count.value++;
  </script>
  
  <div>
    <h1>Count: {state.count.value}</h1>
    <button onClick={increment}>Increment</button>
  </div>
</Counter>;
```

---

## ✨ Features

- ⚡ **Zero Imports** - Components auto-discover each other
- 🎯 **Fine-Grained Reactivity** - Powered by Preact Signals
- 🤖 **AI-First Syntax** - Clear, intuitive, perfect for code generation
- 📦 **Tiny Bundle** - Compiles to optimized Preact
- 🔥 **Hot Reload** - Instant feedback during development
- 🎨 **VS Code Extension** - Full syntax highlighting and IntelliSense

---

## 🚀 Quick Start

### Installation

```bash
npm create speck-app my-app
cd my-app
npm run dev
```

> **Note:** Package is coming to npm soon! For now, clone this repo and run locally.

Your app is now running at `http://localhost:5173`!

### Your First Component

Create `src/components/Hello.speck`:

```speck
<Hello>
  <state name={"World"} />
  
  <div>
    <h1>Hello, {state.name.value}!</h1>
    <input 
      value={state.name.value}
      onChange={(e) => state.name.value = e.target.value}
    />
  </div>
</Hello>;
```

That's it! No imports, no boilerplate, just build.

---

## 🎯 Core Concepts

### Reactive State

State is reactive by default using Preact Signals:

```speck
<TodoApp>
  <state todos={[]} />
  <state input={""} />
  
  <script>
    const addTodo = () => {
      state.todos.value = [...state.todos.value, state.input.value];
      state.input.value = "";
    };
  </script>
  
  <div>
    <input value={state.input.value} onChange={(e) => state.input.value = e.target.value} />
    <button onClick={addTodo}>Add</button>
    
    <loop of={state.todos.value} let={todo}>
      <li>{todo}</li>
    </loop>
  </div>
</TodoApp>;
```

### Conditional Rendering

```speck
<if condition={state.count.value > 10}>
  <p>Count is greater than 10!</p>
</if>
```

### Loops

```speck
<loop of={state.items.value} let={item}>
  <div>{item.name}</div>
</loop>
```

### Async Data

```speck
<async promise={fetchUser()}>
  <then let={user}>
    <p>Welcome, {user.name}!</p>
  </then>
  <catch let={error}>
    <p>Error: {error.message}</p>
  </catch>
  <loading>
    <p>Loading...</p>
  </loading>
</async>
```

---

## 📚 Documentation

- **[Getting Started Guide](./SPECK_GUIDE.md)** - Complete walkthrough
- **[API Reference](./docs/API.md)** - Full tag and feature documentation
- **[Examples](./examples/)** - Real-world Speck.js apps
- **[VS Code Extension](./vscode-extension/)** - Editor support

---

## 🎨 VS Code Extension

Get the full Speck.js development experience:

1. Install from [VS Code Marketplace](https://marketplace.visualstudio.com/) (search "Speck.js")
2. Or install locally: `code --install-extension vscode-extension/speckjs-0.1.0.vsix`

Features:
- 🎨 Syntax highlighting for `.speck` files
- 📝 Code snippets (type `speck` + Tab)
- 🔧 Auto-formatting and bracket matching
- ⚡ IntelliSense for Speck tags

---

## 🤖 AI Agent Support (Beta)

Build AI-powered apps with built-in agent support:

```speck
<ChatApp>
  <Agent
    purpose="You are a helpful assistant"
    model="claude-3-5-sonnet-20241022"
    provider="anthropic"
  >
    {({ send, response, loading }) => (
      <div>
        <button onClick={() => send("Hello!")}>
          {loading ? "Thinking..." : "Send"}
        </button>
        <p>{response}</p>
      </div>
    )}
  </Agent>
</ChatApp>;
```

> **Note:** Requires API keys and proxy server for production use. See [Agent Guide](./docs/AGENT.md).

---

## 🏗️ Project Structure

```
my-speck-app/
├── src/
│   ├── components/        # Your .speck components
│   │   ├── App.speck
│   │   └── Counter.speck
│   ├── .compiled/         # Auto-generated (gitignored)
│   └── main.js           # Entry point
├── compiler/
│   └── compiler.js       # Speck → JSX compiler
├── index.html
└── package.json
```

---

## 🛠️ Commands

- `npm run dev` - Start dev server with hot reload
- `npm run build` - Build for production
- `npm run compile` - Manually compile `.speck` files

---

## 🌍 Why Speck.js?

### For Developers
- **Write less code** - No import statements, minimal boilerplate
- **Think reactively** - State updates are automatic
- **Debug easily** - Clear, readable compiled output
- **Build faster** - Hot reload, instant feedback

### For AI
- **Clear syntax** - Easy to parse and generate
- **Consistent patterns** - Predictable component structure
- **Self-documenting** - Tags describe their purpose
- **Human-readable** - Code reads like natural language

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repo**
2. **Create a branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Commit:** `git commit -m 'Add amazing feature'`
5. **Push:** `git push origin feature/amazing-feature`
6. **Open a Pull Request**

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## 📋 Roadmap

- [x] Core compiler with JSX output
- [x] Fine-grained reactivity with Signals
- [x] VS Code extension
- [x] Component lifecycle hooks
- [x] Routing support
- [ ] TypeScript support
- [ ] Server-side rendering
- [ ] Testing utilities
- [ ] Mobile app support (React Native)
- [ ] Browser DevTools extension

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

---

## 🙏 Acknowledgments

Built with:
- [Preact](https://preactjs.com/) - Fast 3kb React alternative
- [Preact Signals](https://preactjs.com/guide/v10/signals/) - Fine-grained reactivity
- [Vite](https://vitejs.dev/) - Next-generation build tool
- [Babel](https://babeljs.io/) - JavaScript compiler

---

## 💬 Community

- **GitHub Issues** - Bug reports and feature requests
- **Discussions** - Questions and community chat
- **Twitter** - [@speckjs](https://twitter.com/speckjs) (coming soon)

---

**Made with 💜 by the Speck.js community**

Star ⭐ this repo if you find it useful!
