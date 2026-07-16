import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { logger } from "../logger.js";

export function requestContext(req, res, next) {
  const requestId = req.header("x-request-id") || randomUUID();
  const startedAt = process.hrtime.bigint();

  req.context = { requestId, service: config.serviceName };
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
    logger.debug(
      {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration_ms: Number(ms.toFixed(1)),
        request_id: requestId,
      },
      "request completed",
    );
  });

  next();
}
