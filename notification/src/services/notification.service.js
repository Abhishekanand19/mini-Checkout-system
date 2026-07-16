import { trace } from "@opentelemetry/api";
import { config } from "../config.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function sendConfirmation({
  productName,
  transactionId,
  orderId,
  userId,
  requestId,
}) {
  const span = trace.getActiveSpan();
  const recipient = `${userId || "demo-user-01"}@${config.recipientDomain}`;

  span?.setAttributes({
    "notification.channel": config.channel,
    "notification.template": config.template,
    "notification.recipient": recipient,
    "order.id": orderId || "unknown",
    "user.id": userId || "unknown",
  });

  await sleep(200);

  console.log(
    `[${config.serviceName}] Confirmation sent for "${productName}" txn=${transactionId} req=${requestId}`,
  );

  return {
    sent: true,
    channel: config.channel,
    recipient,
    sentAt: new Date().toISOString(),
  };
}
