import { trace } from "@opentelemetry/api";
import { config } from "../config.js";
import { callService } from "../lib/httpClient.js";
import { insertOrder } from "../db.js";
import { logger } from "../logger.js";

function makeOrderRef() {
  return `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function runCheckout({ productId, quantity, requestId }) {
  const span = trace.getActiveSpan();
  const orderRef = makeOrderRef();
  const userId = config.demoUserId;
  const startedAt = Date.now();

  span?.setAttributes({
    "order.id": orderRef,
    "user.id": userId,
    "cart.items": quantity,
    "checkout.currency": config.currency,
  });

  logger.info(
    {
      order_id: orderRef,
      user_id: userId,
      product_id: productId,
      cart_items: quantity,
      request_id: requestId,
    },
    "checkout started",
  );

  // 1. Inventory
  const stock = await callService({
    name: "inventory",
    url: `${config.inventoryUrl}/inventory/check`,
    body: { productId, quantity, orderId: orderRef, userId },
    requestId,
  });

  const amount = Number((stock.price * quantity).toFixed(2));
  span?.setAttribute("checkout.total", amount);

  logger.info(
    {
      order_id: orderRef,
      product_name: stock.productName,
      available: stock.remainingStock,
      checkout_total: amount,
    },
    "inventory check completed",
  );

  // 2. Payment
  const payment = await callService({
    name: "payment",
    url: `${config.paymentUrl}/payment/charge`,
    body: { amount, productId, orderId: orderRef, userId },
    requestId,
    timeoutMs: 15000,
  });

  logger.info(
    {
      order_id: orderRef,
      transaction_id: payment.transactionId,
      amount,
      currency: config.currency,
    },
    "payment completed",
  );

  // 3. Notification — non-fatal
  let notified = false;
  try {
    const n = await callService({
      name: "notification",
      url: `${config.notificationUrl}/notification/send`,
      body: {
        productName: stock.productName,
        transactionId: payment.transactionId,
        orderId: orderRef,
        userId,
      },
      requestId,
    });
    notified = n.sent === true;
    logger.info(
      { order_id: orderRef, channel: n.channel, recipient: n.recipient },
      "notification completed",
    );
  } catch (err) {
    logger.error(
      { order_id: orderRef, err: err.message, downstream: "notification" },
      "notification failed (non-fatal, order will still complete)",
    );
  }

  // 4. Persist
  const order = await insertOrder({
    productName: stock.productName,
    quantity,
    price: amount,
    status: "CONFIRMED",
  });

  logger.info(
    { order_id: orderRef, db_order_id: order.id, status: order.status },
    "order saved to database",
  );

  logger.info(
    {
      order_id: orderRef,
      db_order_id: order.id,
      checkout_total: amount,
      notified,
      duration_ms: Date.now() - startedAt,
      request_id: requestId,
    },
    "checkout completed",
  );

  return {
    orderId: order.id,
    orderRef,
    productName: order.product_name,
    quantity: order.quantity,
    price: Number(order.price),
    status: order.status,
    createdAt: order.created_at,
    transactionId: payment.transactionId,
    notified,
  };
}
