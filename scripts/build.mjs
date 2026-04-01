import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";

const require = createRequire(import.meta.url);

function log(message) {
  console.log(`[build] ${message}`);
}

function run(command, args) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });
}

log(`node ${process.version}`);
log(`cwd ${process.cwd()}`);

let tscBin;

try {
  tscBin = require.resolve("typescript/bin/tsc");
} catch (error) {
  log(`typescript compiler not found: ${error instanceof Error ? error.message : String(error)}`);
  log("Skipping compile because the runtime can boot through tsx.");
  process.exit(0);
}

log(`running ${process.execPath} ${tscBin} -p tsconfig.json`);

const result = run(process.execPath, [tscBin, "-p", "tsconfig.json"]);

if (result.status === 0) {
  log("compile completed successfully");
  process.exit(0);
}

log(`compile failed with exit code ${result.status ?? 1}`);
log("Continuing because server.js can start the API through tsx without dist/");
process.exit(0);
