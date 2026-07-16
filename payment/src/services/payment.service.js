import { randomUUID } from "node:crypto";
import { trace } from "@opentelemetry/api";
import { config } from "../config.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

  console.log(`[${config.serviceName}] Processing payment... req=${requestId}`);

  await sleep(config.paymentDelayMs);

  const transactionId = `txn_${randomUUID().slice(0, 12)}`;

  span?.setAttribute("payment.status", "SUCCESS");

  console.log(
    `[${config.serviceName}] Payment Successful ${transactionId} req=${requestId}`,
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
