import { createApp } from "./app.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

const server = createApp().listen(config.port, () => {
  logger.info({ port: config.port }, "service started");
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
