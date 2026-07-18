import { createApp } from "./app.js";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { pool } from "./db.js";

const server = createApp().listen(config.port, () => {
  logger.info({ port: config.port }, "service started");
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  });
}
