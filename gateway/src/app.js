import express from "express";
import cors from "cors";
import { requestContext } from "./middleware/requestContext.js";
import { checkoutRoutes } from "./routes/checkout.routes.js";
import { config } from "./config.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: true, exposedHeaders: ["x-request-id"] }));
  app.use(express.json());
  app.use(requestContext);

  app.get("/health", (req, res) =>
    res.json({ ok: true, service: config.serviceName }),
  );
  app.use("/api", checkoutRoutes);

  app.use((req, res) => res.status(404).json({ error: "NOT_FOUND" }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status && err.status >= 400 ? err.status : 500;
    console.error(
      `[${config.serviceName}] error ${err.message} downstream=${err.downstream || "-"} req=${req.context?.requestId}`,
    );
    res.status(status).json({
      error: err.message || "INTERNAL_ERROR",
      downstream: err.downstream,
      details: err.payload,
    });
  });

  return app;
}
