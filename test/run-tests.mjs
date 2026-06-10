// Speck.js test runner: app creation, <Agent /> components, reactivity.
import fs from "fs";
import { tmpDir } from "./helpers.mjs";

const suites = [
  ["App creation (create-speck-app)", "./app-creation.test.mjs"],
  ["<Agent /> component creation", "./agent-component.test.mjs"],
  ["Fine-grained reactivity (signals)", "./reactivity.test.mjs"],
];

let failed = 0;

for (const [name, file] of suites) {
  console.log(`\n🧪 ${name}`);
  try {
    const { run } = await import(file);
    await run();
    console.log(`   ✅ PASS`);
  } catch (error) {
    failed++;
    console.error(`   ❌ FAIL: ${error.message}`);
    if (process.env.DEBUG) console.error(error.stack);
  }
}

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log(
  `\n${failed === 0 ? "✅ All test suites passed!" : `❌ ${failed} suite(s) failed`}\n`
);
process.exit(failed === 0 ? 0 : 1);
