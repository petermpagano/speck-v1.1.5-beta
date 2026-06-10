// Verifies <Agent.Chat memory={true} /> compiles and renders.
import path from "path";
import fs from "fs";
import { execFileSync } from "child_process";
import {
  repoRoot,
  assert,
  setupDom,
  bundleAndImport,
  tick,
} from "./helpers.mjs";

export async function run() {
  // Clean compile of the repo's own app — Agent must come back as a built-in.
  fs.rmSync(path.join(repoRoot, "src/.compiled"), {
    recursive: true,
    force: true,
  });
  execFileSync(process.execPath, ["compiler/compiler.js"], {
    cwd: repoRoot,
    stdio: "pipe",
  });

  const compiledChat = fs.readFileSync(
    path.join(repoRoot, "src/.compiled/SimpleChat.jsx"),
    "utf-8"
  );
  assert(
    compiledChat.includes("<Agent.Chat"),
    "compiler preserves <Agent.Chat /> member-expression tags"
  );
  assert(
    compiledChat.includes("memory={true}"),
    "compiler preserves the memory={true} prop"
  );
  const registry = fs.readFileSync(
    path.join(repoRoot, "src/.compiled/_componentRegistry.js"),
    "utf-8"
  );
  assert(
    /export\s*\{[^}]*\bAgent\b/.test(registry),
    "registry exports the built-in Agent after a clean compile"
  );

  // Render the compiled SimpleChat (which uses <Agent.Chat memory={true} />).
  setupDom();
  const entry = `
    import { h, render } from "preact";
    import SimpleChat from "./src/.compiled/SimpleChat.jsx";
    import Agent from "./src/.compiled/Agent.jsx";
    export { SimpleChat, Agent, h, render };
  `;
  const mod = await bundleAndImport(entry, repoRoot, "agent");

  assert(
    typeof mod.Agent === "function" && typeof mod.Agent.Chat === "function",
    "Agent exposes compound components (Agent.Chat, Agent.Input, ...)"
  );

  const container = document.createElement("div");
  document.body.appendChild(container);
  mod.render(mod.h(mod.SimpleChat, {}), container);
  await tick();

  const input = container.querySelector("input[type='text']");
  assert(input !== null, "<Agent.Chat /> renders a message input");
  const buttons = [...container.querySelectorAll("button")];
  assert(
    buttons.some((b) => b.textContent.includes("Send")),
    "<Agent.Chat /> renders a Send button"
  );

  // Render Agent.Chat directly with memory enabled — must not throw.
  const direct = document.createElement("div");
  document.body.appendChild(direct);
  mod.render(
    mod.h(mod.Agent.Chat, { id: "test-agent", memory: true }),
    direct
  );
  await tick();
  assert(
    direct.querySelector("input") !== null,
    "<Agent.Chat memory={true} /> mounts without errors"
  );
}
