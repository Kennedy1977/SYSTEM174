require("dotenv").config();

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

const app = next({
  dev,
  hostname: host,
  port,
  dir: __dirname,
});
const handle = app.getRequestHandler();
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

  const nextReadyPromise = app
    .prepare()
    .then(() => {
      nextReady = true;
      console.log("Next app prepared successfully");
    })
    .catch((error) => {
      startupError = error;
      console.error("Next app failed during prepare()");
      console.error(error);
    });

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
