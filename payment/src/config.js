export const config = {
  serviceName: process.env.SERVICE_NAME || "payment-service",
  port: Number(process.env.PORT || 4002),
  paymentDelayMs: Number(process.env.PAYMENT_DELAY_MS || 2000),
  provider: process.env.PAYMENT_PROVIDER || "Stripe",
  currency: process.env.PAYMENT_CURRENCY || "INR",
  method: process.env.PAYMENT_METHOD || "UPI",
};
