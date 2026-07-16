import { createApp } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";

const server = createApp().listen(config.port, () => {
  console.log(`[${config.serviceName}] listening on :${config.port}`);
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  });
}
