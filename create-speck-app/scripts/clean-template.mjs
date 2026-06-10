// Removes local build artifacts from template/ before publishing so they
// can never be bundled into the npm package. Runs automatically via the
// "prepublishOnly" script. Safe to run anytime; cross-platform (Node only).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.join(__dirname, "..", "template");

const JUNK = ["node_modules", "local.db", "dist", ".env"];

for (const entry of JUNK) {
  const target = path.join(templateDir, entry);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`🧹 Removed template/${entry} before publish`);
  }
}
