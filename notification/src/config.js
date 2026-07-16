export const config = {
  serviceName: process.env.SERVICE_NAME || "notification-service",
  port: Number(process.env.PORT || 4003),
  channel: process.env.NOTIFICATION_CHANNEL || "email",
  template: process.env.NOTIFICATION_TEMPLATE || "order_confirmation_v2",
  recipientDomain: process.env.NOTIFICATION_DOMAIN || "example.com",
};
