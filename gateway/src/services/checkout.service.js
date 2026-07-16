import { trace } from "@opentelemetry/api";
import { config } from "../config.js";
import { callService } from "../lib/httpClient.js";
import { insertOrder } from "../db.js";

function makeOrderRef() {
  return `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function runCheckout({ productId, quantity, requestId }) {
  const span = trace.getActiveSpan();
  const orderRef = makeOrderRef();
  const userId = config.demoUserId;

  span?.setAttributes({
    "order.id": orderRef,
    "user.id": userId,
    "cart.items": quantity,
    "checkout.currency": config.currency,
  });

  // 1. Inventory
  const stock = await callService({
    name: "inventory",
    url: `${config.inventoryUrl}/inventory/check`,
    body: { productId, quantity, orderId: orderRef, userId },
    requestId,
  });

  const amount = Number((stock.price * quantity).toFixed(2));

  span?.setAttribute("checkout.total", amount);

  // 2. Payment
  const payment = await callService({
    name: "payment",
    url: `${config.paymentUrl}/payment/charge`,
    body: { amount, productId, orderId: orderRef, userId },
    requestId,
    timeoutMs: 15000,
  });

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
  } catch (err) {
    console.error(
      `[${config.serviceName}] notification failed (non-fatal) req=${requestId}`,
      err.message,
    );
  }

  // 4. Persist
  const order = await insertOrder({
    productName: stock.productName,
    quantity,
    price: amount,
    status: "CONFIRMED",
  });

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
