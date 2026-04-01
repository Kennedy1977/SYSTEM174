import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function getEnvValue(key) {
  return process.env[key]?.trim() ?? "";
}

const buildEnv = {
  ...process.env,
  NODE_ENV: getEnvValue("NODE_ENV") || "production",
  RAYON_NUM_THREADS: getEnvValue("RAYON_NUM_THREADS") || "1",
};

let nextBin;

try {
  nextBin = require.resolve("next/dist/bin/next");
} catch (error) {
  const message = error instanceof Error ? error.message : "unknown resolution error";
  console.error(`Next build binary not found: ${message}`);
  process.exit(1);
}

console.log(
  `[build] Running Next production build with webpack and RAYON_NUM_THREADS=${buildEnv.RAYON_NUM_THREADS}`,
);

const result = spawnSync(process.execPath, [nextBin, "build", "--webpack"], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: buildEnv,
});

if (result.error) {
  console.error(`Next build failed to launch: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status || 1);
}
