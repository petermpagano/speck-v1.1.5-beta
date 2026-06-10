import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { build } from "esbuild";
import { Window } from "happy-dom";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, "..");
export const tmpDir = path.join(__dirname, ".tmp");

export function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`   ✔ ${message}`);
}

// Installs a happy-dom window as the global DOM so Preact can render.
export function setupDom() {
  const window = new Window();
  for (const key of [
    "window",
    "document",
    "navigator",
    "localStorage",
    "HTMLElement",
    "Event",
  ]) {
    Object.defineProperty(global, key, {
      value: window[key === "window" ? "window" : key],
      configurable: true,
      writable: true,
    });
  }
  return window;
}

// Bundles an entry snippet (JSX allowed) against a project directory and
// imports it as an ES module. Returns the module's exports.
export async function bundleAndImport(entryCode, projectDir, name) {
  const outfile = path.join(tmpDir, `${name}.bundle.mjs`);
  fs.mkdirSync(tmpDir, { recursive: true });

  await build({
    stdin: {
      contents: entryCode,
      resolveDir: projectDir,
      loader: "jsx",
      sourcefile: `${name}.entry.jsx`,
    },
    bundle: true,
    format: "esm",
    platform: "browser",
    jsx: "automatic",
    jsxImportSource: "preact",
    outfile,
    logLevel: "silent",
  });

  return import(outfile + `?t=${Date.now()}`);
}

export const tick = (ms = 50) => new Promise((r) => setTimeout(r, ms));
