# Speck.js Guide

The AI-Native Web Framework. Write less. Build faster. No imports. Pure magic.

## Quick Start

npm create speck-app my-app
cd my-app
cp .env.example .env  # Add your Anthropic API key
npm run dev

## Core Concepts

### Components
Create .speck files in src/components/. They auto-discover each other.

### State (Signals)
<state count={0} />
Access with state.count.value

### Conditionals
<if condition={state.loggedIn.value}>...</if>

### Loops
<loop of={items} let={item}>...</loop>

## AI Components

Use the built-in Agent component:

<Agent purpose="You are helpful" model="claude-sonnet-4-20250514" streaming={true}>
  {({ send, response, loading, error }) => (
    <button onClick={() => send('Hello')}>{loading ? 'Thinking...' : 'Send'}</button>
  )}
</Agent>

## Scripts

- npm run dev: Start everything (Vite + compiler + AI proxy)
- npm run dev:no-agent: Start without AI proxy
- npm run build: Production build

## Links

- GitHub: https://github.com/petermpagano/speck-v1.1.5-beta
- npm: https://www.npmjs.com/package/create-speck-app
