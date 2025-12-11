# Speck.js for VS Code

Official Visual Studio Code extension for [Speck.js](https://github.com/petermpagano/speckjs) - The AI-Native Web Framework.

## Features

✨ **Syntax Highlighting** - Full language support for `.speck` files  
🎯 **IntelliSense** - Smart completions for Speck tags and attributes  
📝 **Snippets** - Quick component templates  
🔧 **Auto-formatting** - Proper indentation and bracket matching  
🎨 **Tag Recognition** - Special highlighting for `<state>`, `<script>`, `<if>`, `<loop>`, `<async>`, and more

## Supported Speck Tags

- `<state>` - Reactive state declarations
- `<script>` - Component logic
- `<if>` - Conditional rendering
- `<loop>` - Iteration
- `<async>` - Async data fetching
- `<Router>` / `<route>` - Client-side routing
- `<slot>` / `<props>` - Component composition
- `<onMount>` - Lifecycle hooks
- `<Agent>` - AI agent integration

## Quick Start

### Install the Extension

1. Open VS Code
2. Press `Ctrl+P` (or `Cmd+P` on Mac)
3. Type `ext install speckjs.speckjs`
4. Press Enter

### Create Your First Component

1. Create a new file with `.speck` extension
2. Type `speck` and press Tab
3. Start building!

## Snippets

Type these prefixes and press `Tab`:

- `speck` - Basic component template
- `speck-full` - Full component with state, script, and props
- `state` - Add reactive state
- `script` - Add script block
- `if` - Conditional rendering
- `loop` - Loop over items
- `async` - Async data fetching
- `router` - Add routing
- `agent` - AI Agent component

## Example

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

## Requirements

- Visual Studio Code 1.75.0 or higher
- Speck.js compiler (install via npm: `npm create speck-app`)

## Contributing

Found a bug or want to contribute? Check out the [GitHub repository](https://github.com/petermpagano/speckjs).

## License

MIT License - See LICENSE file for details

---

**Made with 💜 by the Speck.js community**
