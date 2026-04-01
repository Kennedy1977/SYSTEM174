require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const express = require("express");
const next = require("next");

const lifecycle = process.env.npm_lifecycle_event || "";
const inferredNodeEnv =
  process.env.NODE_ENV ||
  (lifecycle === "start" || lifecycle === "preview"
    ? "production"
    : "development");

process.env.NODE_ENV = inferredNodeEnv;

const dev = inferredNodeEnv !== "production";
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const nextBuildDir = path.resolve(__dirname, ".next");
const buildScriptPath = path.resolve(__dirname, "scripts/run-next-build.mjs");
const requiredBuildArtifacts = [
  "BUILD_ID",
  "build-manifest.json",
  "prerender-manifest.json",
  "routes-manifest.json",
  "required-server-files.json",
  "server/pages-manifest.json",
  "server/app-paths-manifest.json",
].map((relativePath) => path.join(nextBuildDir, relativePath));

function requireSupportedNodeVersion() {
  const [nodeMajor, nodeMinor] = process.versions.node
    .split(".")
    .map((part) => Number(part));

  if (nodeMajor < 20 || (nodeMajor === 20 && nodeMinor < 9)) {
    console.error(
      `Node ${process.version} detected. This app requires Node >=20.9.0 (recommended: 22.x).`,
    );
    process.exit(1);
  }
}

function runBuildStep(label, args) {
  const result = spawnSync(process.execPath, args, {
    cwd: __dirname,
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    console.error(`${label} failed to launch: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${label} failed with exit code ${result.status}.`);
    process.exit(result.status || 1);
  }
}

function getMissingBuildArtifacts() {
  return requiredBuildArtifacts.filter((artifactPath) => !fs.existsSync(artifactPath));
}

function hasCompleteProductionBuild() {
  return getMissingBuildArtifacts().length === 0;
}

function isMissingBuildArtifactError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Could not find a production build") ||
    (message.includes(".next") && message.includes("ENOENT")) ||
    message.includes("prerender-manifest.json") ||
    message.includes("routes-manifest.json") ||
    message.includes("required-server-files.json")
  );
}

function ensureProductionBuild(force = false) {
  if (dev) {
    return;
  }

  const missingArtifacts = getMissingBuildArtifacts();

  if (!force && missingArtifacts.length === 0) {
    return;
  }

  if (force) {
    console.log("Rebuilding Next production assets before startup...");
  } else {
    console.log("Next production build is incomplete. Running next build before startup...");
    for (const artifactPath of missingArtifacts) {
      console.log(`Missing build artifact: ${artifactPath}`);
    }
  }

  if (!fs.existsSync(buildScriptPath)) {
    console.error(`Build script missing: ${buildScriptPath}`);
    process.exit(1);
  }

  runBuildStep("Next build", [buildScriptPath]);

  const missingAfterBuild = getMissingBuildArtifacts();
  if (missingAfterBuild.length > 0) {
    console.error("Build completed but required production artifacts are still missing.");
    for (const artifactPath of missingAfterBuild) {
      console.error(`Still missing: ${artifactPath}`);
    }
    process.exit(1);
  }
}

requireSupportedNodeVersion();
ensureProductionBuild();
const startupResponseBody =
  "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Starting</title><style>body{margin:0;font-family:Arial,sans-serif;background:#06080c;color:#f5f7fb;display:grid;place-items:center;min-height:100vh;padding:24px;text-align:center}p{color:#aab6c6;max-width:32rem;line-height:1.5}</style></head><body><main><h1>SYSTEM174 is starting up</h1><p>The app is warming up on the server. Please try again in a moment.</p></main></body></html>";

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection");
  console.error(error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception");
  console.error(error);
});

async function start() {
  const server = express();
  server.disable("x-powered-by");
  server.set("trust proxy", true);
  let nextReady = false;
  let startupError = null;
  let app = next({
    dev,
    hostname: host,
    port,
    dir: __dirname,
  });
  let handle = app.getRequestHandler();
  let rebuildAttempted = false;

  const prepareNext = async () => {
    try {
      await app.prepare();
      nextReady = true;
      startupError = null;
      console.log("Next app prepared successfully");
    } catch (error) {
      if (!rebuildAttempted && isMissingBuildArtifactError(error)) {
        try {
          rebuildAttempted = true;
          console.warn("Next app prepare detected missing production artifacts. Rebuilding once...");
          ensureProductionBuild(true);
          app = next({
            dev,
            hostname: host,
            port,
            dir: __dirname,
          });
          handle = app.getRequestHandler();
          await app.prepare();
          nextReady = true;
          startupError = null;
          console.log("Next app prepared successfully after rebuild");
          return;
        } catch (rebuildError) {
          startupError = rebuildError;
          console.error("Next app failed during prepare() after rebuild");
          console.error(rebuildError);
          return;
        }
      }

      startupError = error;
      console.error("Next app failed during prepare()");
      console.error(error);
    }
  };

  const nextReadyPromise = prepareNext();

  server.get("/healthz", (_request, response) => {
    response.status(startupError ? 500 : 200).json({
      ok: !startupError,
      ready: nextReady,
      runtime: "next-express",
      nodeEnv: inferredNodeEnv,
      siteVariant: process.env.SITE_VARIANT || "system174",
      siteUrl: process.env.SITE_URL || null,
      startupError:
        startupError instanceof Error
          ? startupError.message
          : startupError
            ? String(startupError)
            : null,
    });
  });

  server.use((request, response, nextMiddleware) => {
    if (request.path === "/healthz") {
      nextMiddleware();
      return;
    }

    if (startupError) {
      response.status(500).type("text/plain").send("Application failed to start.");
      return;
    }

    if (!nextReady) {
      response
        .status(200)
        .set("Cache-Control", "no-store, max-age=0")
        .type("text/html; charset=utf-8")
        .send(startupResponseBody);
      return;
    }

    nextMiddleware();
  });

  server.all(/.*/, async (request, response) => {
    await nextReadyPromise;
    return handle(request, response);
  });

  const httpServer = server.listen(port, host, () => {
    console.log(
      `SYSTEM174 listening on http://${host}:${port} (${inferredNodeEnv})`,
    );
  });

  httpServer.on("close", () => {
    console.warn("SYSTEM174 server closed");
  });

  httpServer.on("error", (error) => {
    console.error("SYSTEM174 server error");
    console.error(error);
  });
}

start().catch((error) => {
  console.error("Failed to start SYSTEM174 server");
  console.error(error);
  process.exit(1);
});
