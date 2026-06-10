#!/usr/bin/env node
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flags = process.argv.slice(2).filter((a) => a.startsWith("--"));
const skipInstall = flags.includes("--no-install");

const projectName = args[0] || "my-speck-app";

// Validate project name before touching the filesystem
if (!/^[a-z0-9@._-]+$/i.test(projectName) || projectName.includes("..")) {
  console.error(
    `\n✖ Invalid project name: "${projectName}"\n  Use letters, numbers, dashes, dots and underscores only.\n`
  );
  process.exit(1);
}

const targetDir = path.resolve(process.cwd(), projectName);
const templateDir = path.join(__dirname, "template");

if (!fs.existsSync(templateDir)) {
  console.error(
    "\n✖ Template directory is missing from this create-speck-app installation."
  );
  console.error(
    "  Try clearing your npx cache and re-running with the latest version:"
  );
  console.error("    npm create speck-app@latest " + projectName + "\n");
  process.exit(1);
}

console.log(`\n🚀 Creating a new Speck.js app in ${targetDir}\n`);

if (fs.existsSync(targetDir)) {
  console.error(`✖ Directory "${projectName}" already exists!`);
  console.error("  Remove it or choose a different project name.\n");
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

// Files that should never be copied into a fresh app
const SKIP_FILES = new Set(["node_modules", "dist", "local.db", ".DS_Store"]);

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);
    files.forEach((file) => {
      if (SKIP_FILES.has(file)) return;
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  copyRecursive(templateDir, targetDir);
} catch (error) {
  console.error(`✖ Failed to copy template files: ${error.message}\n`);
  process.exit(1);
}

// npm strips ".gitignore" from published packages, so the template ships it
// as "gitignore" and we restore the dot here.
const plainGitignore = path.join(targetDir, "gitignore");
const dotGitignore = path.join(targetDir, ".gitignore");
if (fs.existsSync(plainGitignore)) {
  fs.renameSync(plainGitignore, dotGitignore);
}

// Copy .env.example to .env so users just need to add their API key
const envExamplePath = path.join(targetDir, ".env.example");
const envPath = path.join(targetDir, ".env");
if (fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
}

const packageJsonPath = path.join(targetDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
packageJson.name = projectName.replace(/^@.*\//, "").toLowerCase();
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

console.log("✔ Project created successfully!\n");

function printNextSteps() {
  console.log("\n🎉 All done! Your Speck.js app is ready!\n");
  console.log("👉 Next steps:\n");
  console.log(`   cd ${projectName}`);
  if (skipInstall) {
    console.log("   npm install");
  }
  console.log("   Add your Anthropic API key to .env");
  console.log("   npm run dev\n");
  console.log("💜 Happy building!\n");
}

if (skipInstall) {
  printNextSteps();
} else {
  console.log("📦 Installing dependencies...\n");

  const install = spawn("npm", ["install"], {
    cwd: targetDir,
    stdio: "inherit",
    shell: true,
  });

  install.on("error", (error) => {
    console.error(`\n✖ Could not run npm install: ${error.message}`);
    console.error(
      `  Run it manually:\n\n   cd ${projectName}\n   npm install\n   npm run dev\n`
    );
    process.exit(1);
  });

  install.on("close", (code) => {
    if (code !== 0) {
      console.error("\n✖ npm install failed.");
      console.error(
        `  Fix the error above, then run:\n\n   cd ${projectName}\n   npm install\n   npm run dev\n`
      );
      process.exit(1);
    }

    printNextSteps();
  });
}
