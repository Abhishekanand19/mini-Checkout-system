import { trace } from "@opentelemetry/api";
import { config } from "../config.js";
import { logger } from "../logger.js";

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

  logger.info(
    {
      order_id: orderId,
      channel: config.channel,
      template: config.template,
      recipient,
    },
    "notification queued",
  );

  await sleep(200);

  logger.info(
    {
      order_id: orderId,
      transaction_id: transactionId,
      channel: config.channel,
      recipient,
      request_id: requestId,
    },
    "notification sent",
  );

  return {
    sent: true,
    channel: config.channel,
    recipient,
    sentAt: new Date().toISOString(),
  };
}
