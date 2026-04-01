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

async function start() {
  await app.prepare();

  const server = express();
  server.disable("x-powered-by");
  server.set("trust proxy", true);

  server.get("/healthz", (_request, response) => {
    response.status(200).json({
      ok: true,
      runtime: "next-express",
      nodeEnv: inferredNodeEnv,
    });
  });

  server.all(/.*/, (request, response) => handle(request, response));

  server.listen(port, host, () => {
    console.log(
      `SYSTEM174 listening on http://${host}:${port} (${inferredNodeEnv})`,
    );
  });
}

start().catch((error) => {
  console.error("Failed to start SYSTEM174 server");
  console.error(error);
  process.exit(1);
});
