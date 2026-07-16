export const config = {
  serviceName: process.env.SERVICE_NAME || "gateway-service",
  port: Number(process.env.PORT || 4000),
  inventoryUrl: process.env.INVENTORY_URL || "http://localhost:4001",
  paymentUrl: process.env.PAYMENT_URL || "http://localhost:4002",
  notificationUrl: process.env.NOTIFICATION_URL || "http://localhost:4003",
  databaseUrl: process.env.DATABASE_URL,
  demoUserId: process.env.DEMO_USER_ID || "demo-user-01",
  currency: process.env.CHECKOUT_CURRENCY || "INR",
};
