# create-speck-app

Scaffold a new [Speck.js](https://speckjs.dev) application with one command.

Speck.js is an AI-first web framework: JSX-like `.speck` components, fine-grained
reactivity powered by Preact Signals, and built-in AI agents you can drop into
your UI with a single tag.

## Quick Start

```bash
npm create speck-app@latest my-app
cd my-app
npm run dev
```

Your app is now running at `http://localhost:5173`.

> **Tip:** Always include `@latest` — it makes sure npm doesn't reuse an older
> cached version of this scaffolder.

### Requirements

- Node.js **18 or newer**

### Enable the AI agent (optional)

The starter app includes a working AI chat built with `<Agent.Chat />`. To
activate it, add your Anthropic API key to the `.env` file in your new project:

```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

Then restart `npm run dev`. Without a key, everything else still works — only
the chat replies with a "key not configured" error.

## What's Included

- ✅ Speck.js compiler with auto-watch for `.speck` files
- ✅ Vite dev server with hot reload
- ✅ Preact + Preact Signals (fine-grained reactivity)
- ✅ Built-in `<Agent />` components — full AI chat in one line:
  ```jsx
  <Agent.Chat purpose="You are a helpful assistant." memory={true} />
  ```
- ✅ Persistent agent memory (`memory={true}`) backed by a local SQLite database
- ✅ Example components to learn from (`src/components/*.speck`)

## Your First Component

Create `src/components/Hello.speck`:

```jsx
<Hello>
  <state name={"World"} />

  <div>
    <h1>Hello, {state.name.value}!</h1>
  </div>
</Hello>;
```

Then use it anywhere — no imports needed:

```jsx
<App>
  <Hello />
</App>;
```

See `SPECK_GUIDE.md` in your new project for the full syntax guide.

## Troubleshooting

**`npm create speck-app` fails or behaves strangely?**
You may be running a stale cached version. Run with `@latest`, or clear the
cache first:

```bash
npx clear-npx-cache   # or: rm -rf ~/.npm/_npx
npm create speck-app@latest my-app
```

**Want to skip the automatic `npm install`?**

```bash
npm create speck-app@latest my-app -- --no-install
```

## Links

- 🏠 Homepage: [speckjs.dev](https://speckjs.dev)
- 📦 GitHub: [petermpagano/speckjs](https://github.com/petermpagano/speckjs)
- 🐛 Issues: please report bugs on GitHub

## License

MIT
