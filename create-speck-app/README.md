# create-speck-app

Scaffold a new Speck.js application with one command.

## Usage

```bash
npm create speck-app my-app
cd my-app
npm run dev
```

## What's Included

- ✅ Speck.js compiler
- ✅ Vite dev server with hot reload
- ✅ Preact + Preact Signals
- ✅ Example components
- ✅ Auto-watch for `.speck` files

## Publishing to npm

### First Time Setup

1. **Create npm account** at https://npmjs.com
2. **Login:**
   ```bash
   npm login
   ```

### Publish

```bash
cd create-speck-app
npm publish
   ```

Now anyone can use:
```bash
npm create speck-app my-app
```

### Update Version

When making changes:

```bash
npm version patch  # 0.1.0 -> 0.1.1
npm version minor  # 0.1.1 -> 0.2.0
npm version major  # 0.2.0 -> 1.0.0
npm publish
```

## Template Structure

The `template/` folder contains the starter project:

```
template/
├── compiler/          # Speck compiler
├── src/
│   ├── components/    # Example .speck components
│   └── main.js
├── index.html
├── package.json
└── vite.config.js
```

Any changes to the template will be included in new projects!
