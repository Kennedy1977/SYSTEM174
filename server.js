const { existsSync } = require("node:fs");
const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");

const buildOutputPath = path.join(__dirname, "dist", "main.js");
const runtimeEntryPath = path.join(__dirname, "src", "main.ts");

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

if (existsSync(buildOutputPath)) {
  require(buildOutputPath);
  return;
}

console.log(
  `${buildOutputPath} is still missing after build. Starting API through tsx runtime instead...`,
);

const child = spawn(process.execPath, ["--import", "tsx", runtimeEntryPath], {
  cwd: __dirname,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`tsx runtime exited from signal ${signal}`);
    process.exit(1);
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("Failed to start tsx runtime", error);
  process.exit(1);
});
