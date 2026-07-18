import express from "express";
import { requestContext } from "./middleware/requestContext.js";
import { paymentRoutes } from "./routes/payment.routes.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestContext);

  app.get("/health", (req, res) =>
    res.json({ ok: true, service: config.serviceName }),
  );
  app.use("/payment", paymentRoutes);

  app.use((req, res) => res.status(404).json({ error: "NOT_FOUND" }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    logger.error(
      { err: err.message, request_id: req.context?.requestId },
      "unhandled error",
    );
    res.status(500).json({ error: "INTERNAL_ERROR" });
  });

  return app;
}
