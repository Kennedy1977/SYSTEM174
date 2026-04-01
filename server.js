const { existsSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const buildOutputPath = path.join(__dirname, "dist", "main.js");

function runBuild() {
  console.log(`${buildOutputPath} is missing. Running npm run build before startup...`);

  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npmCommand, ["run", "build"], {
    cwd: __dirname,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(buildOutputPath)) {
  runBuild();
}

require(buildOutputPath);
