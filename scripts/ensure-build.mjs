import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const buildOutputPath = "dist/main.js";

if (existsSync(buildOutputPath)) {
  process.exit(0);
}

console.log(`${buildOutputPath} is missing. Running npm run build before start...`);

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npmCommand, ["run", "build"], {
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
