import { trace } from "@opentelemetry/api";
import { config } from "../config.js";

const CATALOG = {
  "prod-001": {
    productName: "Mechanical Keyboard",
    price: 4999.0,
    stock: 100000,
  },
  "prod-002": {
    productName: "Noise Cancelling Headphones",
    price: 8999.0,
    stock: 100000,
  },
};

export function checkStock({ productId, quantity, orderId, userId }) {
  const span = trace.getActiveSpan();
  const item = CATALOG[productId];

  span?.setAttributes({
    "inventory.items_checked": quantity,
    "inventory.warehouse": config.warehouse,
    "order.id": orderId || "unknown",
    "user.id": userId || "unknown",
  });

  if (!item) {
    span?.setAttribute("inventory.available", 0);
    return { ok: false, reason: "PRODUCT_NOT_FOUND" };
  }

  span?.setAttribute("inventory.available", item.stock);

  if (item.stock < quantity) {
    return { ok: false, reason: "OUT_OF_STOCK", available: item.stock };
  }

  item.stock -= quantity;

  return {
    ok: true,
    productId,
    productName: item.productName,
    price: item.price,
    remainingStock: item.stock,
  };
}

export function listProducts() {
  return Object.entries(CATALOG).map(([productId, v]) => ({
    productId,
    productName: v.productName,
    price: v.price,
    stock: v.stock,
  }));
}
