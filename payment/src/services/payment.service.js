import { randomUUID } from "node:crypto";
import { trace } from "@opentelemetry/api";
import { config } from "../config.js";
import { logger } from "../logger.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Simulated upstream provider round-trip. Real gateways are not constant-time,
// so jitter keeps p50/p99 from collapsing onto the same value.
function providerLatency() {
  const jitter =
    config.paymentJitterMs > 0 ? Math.random() * config.paymentJitterMs : 0;
  return Math.round(config.paymentDelayMs + jitter);
}

export async function processPayment({
  amount,
  orderId,
  userId,
  method,
  requestId,
}) {
  const span = trace.getActiveSpan();
  const paymentMethod = method || config.method;

  span?.setAttributes({
    "payment.provider": config.provider,
    "payment.method": paymentMethod,
    "payment.amount": amount,
    "payment.currency": config.currency,
    "order.id": orderId || "unknown",
    "user.id": userId || "unknown",
  });

  logger.info(
    {
      order_id: orderId,
      user_id: userId,
      provider: config.provider,
      method: paymentMethod,
      amount,
      currency: config.currency,
      request_id: requestId,
    },
    "payment request started",
  );

  logger.info(
    { order_id: orderId, amount, currency: config.currency },
    "charging customer",
  );

  await sleep(providerLatency());

  const transactionId = `txn_${randomUUID().slice(0, 12)}`;

  span?.setAttribute("payment.status", "SUCCESS");

  logger.info(
    {
      order_id: orderId,
      transaction_id: transactionId,
      amount,
      status: "SUCCESS",
      request_id: requestId,
    },
    "payment successful",
  );

  return {
    status: "PAID",
    transactionId,
    amount,
    provider: config.provider,
    method: paymentMethod,
    currency: config.currency,
    processedAt: new Date().toISOString(),
  };
}
