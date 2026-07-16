export const config = {
  serviceName: process.env.SERVICE_NAME || "inventory-service",
  port: Number(process.env.PORT || 4001),
  warehouse: process.env.INVENTORY_WAREHOUSE || "BLR-WH-01",
};
