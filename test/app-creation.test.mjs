// Verifies `create-speck-app` scaffolds a complete, compilable app.
import path from "path";
import fs from "fs";
import { execFileSync } from "child_process";
import { repoRoot, tmpDir, assert } from "./helpers.mjs";

export async function run() {
  const workDir = path.join(tmpDir, "scaffold");
  const appName = "speck-test-app";
  const appDir = path.join(workDir, appName);

  fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });

  execFileSync(
    process.execPath,
    [path.join(repoRoot, "create-speck-app/index.js"), appName, "--no-install"],
    { cwd: workDir, stdio: "pipe" }
  );

  assert(fs.existsSync(appDir), "app directory is created");

  const expected = [
    "package.json",
    "index.html",
    "vite.config.js",
    ".env",
    ".gitignore",
    "compiler/compiler.js",
    "plugins/vite-speck-jsx-loader.js",
    "api/server.js",
    "api/db.js",
    "src/main.js",
    "src/lib/Agent.jsx",
    "src/lib/agent-runtime.js",
    "src/components/App.speck",
    "src/components/SimpleChat.speck",
  ];
  for (const file of expected) {
    assert(fs.existsSync(path.join(appDir, file)), `scaffold contains ${file}`);
  }

  assert(
    !fs.existsSync(path.join(appDir, "gitignore")),
    "plain 'gitignore' was renamed to '.gitignore'"
  );
  assert(
    !fs.existsSync(path.join(appDir, "local.db")),
    "stale local.db is not copied into new apps"
  );

  const pkg = JSON.parse(
    fs.readFileSync(path.join(appDir, "package.json"), "utf-8")
  );
  assert(pkg.name === appName, "package.json name is set to the project name");

  const gitignore = fs.readFileSync(path.join(appDir, ".gitignore"), "utf-8");
  assert(gitignore.includes(".env"), ".gitignore protects the .env API key");
  assert(gitignore.includes("local.db"), ".gitignore covers local.db");

  // Reuse the repo's node_modules so the scaffolded compiler can run
  // without a slow npm install (template deps are a subset of the repo's).
  fs.symlinkSync(
    path.join(repoRoot, "node_modules"),
    path.join(appDir, "node_modules"),
    "dir"
  );

  // A fresh compile must regenerate everything, including built-ins.
  fs.rmSync(path.join(appDir, "src/.compiled"), {
    recursive: true,
    force: true,
  });
  execFileSync(process.execPath, ["compiler/compiler.js"], {
    cwd: appDir,
    stdio: "pipe",
  });

  assert(
    fs.existsSync(path.join(appDir, "src/.compiled/Agent.jsx")),
    "compiler restores built-in Agent.jsx after a clean compile"
  );
  const registry = fs.readFileSync(
    path.join(appDir, "src/.compiled/_componentRegistry.js"),
    "utf-8"
  );
  assert(
    /export\s*\{[^}]*\bAgent\b/.test(registry),
    "component registry exports Agent"
  );
  assert(
    /export\s*\{[^}]*\bApp\b/.test(registry),
    "component registry exports App"
  );

  // Rejects invalid project names instead of creating junk directories.
  let rejected = false;
  try {
    execFileSync(
      process.execPath,
      [path.join(repoRoot, "create-speck-app/index.js"), "../evil", "--no-install"],
      { cwd: workDir, stdio: "pipe" }
    );
  } catch {
    rejected = true;
  }
  assert(rejected, "invalid project names are rejected");

  // Refuses to overwrite an existing directory.
  let refusedExisting = false;
  try {
    execFileSync(
      process.execPath,
      [path.join(repoRoot, "create-speck-app/index.js"), appName, "--no-install"],
      { cwd: workDir, stdio: "pipe" }
    );
  } catch {
    refusedExisting = true;
  }
  assert(refusedExisting, "existing directories are not overwritten");

  return appDir;
}
