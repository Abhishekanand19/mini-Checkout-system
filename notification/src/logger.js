import pino from "pino";
import { config } from "./config.js";

/**
 * Trace correlation is automatic.
 * @opentelemetry/instrumentation-pino injects trace_id, span_id, trace_flags
 * into every record emitted inside an active span, and forwards the record
 * to the OTLP logs exporter.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: { service: config.serviceName },
  formatters: {
    level: (label) => ({ level: label }),
  },
});
