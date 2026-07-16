// PHASE 2: `import "./tracing.js";` goes on the line ABOVE everything else.
// That is why bootstrap is separate from app.js.
import { createApp } from "./app.js";
import { config } from "./config.js";

const server = createApp().listen(config.port, () => {
  console.log(`[${config.serviceName}] listening on :${config.port}`);
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
