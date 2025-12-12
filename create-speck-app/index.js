#!/usr/bin/env node
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectName = process.argv[2] || "my-speck-app";
const targetDir = path.resolve(process.cwd(), projectName);

console.log(`\n?? Creating a new Speck.js app in ${targetDir}\n`);

if (fs.existsSync(targetDir)) {
  console.error(`? Directory ${projectName} already exists!`);
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

const templateDir = path.join(__dirname, "template");

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);
    files.forEach((file) => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursive(templateDir, targetDir);

// Copy .env.example to .env so users just need to add their API key
const envExamplePath = path.join(targetDir, ".env.example");
const envPath = path.join(targetDir, ".env");
if (fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
}

const packageJsonPath = path.join(targetDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
packageJson.name = projectName;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log("? Project created successfully!\n");
console.log("?? Installing dependencies...\n");

const install = spawn("npm", ["install"], {
  cwd: targetDir,
  stdio: "inherit",
  shell: true,
});

install.on("close", (code) => {
  if (code !== 0) {
    console.error("? Failed to install dependencies");
    process.exit(1);
  }

  console.log("\n?? All done! Your Speck.js app is ready!\n");
  console.log("?? Next steps:\n");
  console.log(`   cd ${projectName}`);
  console.log("   Add your Anthropic API key to .env");
  console.log("   npm run dev\n");
  console.log("?? Happy building!\n");
});
