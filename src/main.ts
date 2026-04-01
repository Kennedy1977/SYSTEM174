import { buildServer } from "./server.js";
import { getEnv } from "./config/env.js";

async function main() {
  const env = getEnv();
  const server = await buildServer();

  try {
    await server.listen({
      host: env.API_HOST,
      port: env.API_PORT,
    });
    server.log.info(
      `system174-api listening on http://${env.API_HOST}:${env.API_PORT}`,
    );
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

main();
