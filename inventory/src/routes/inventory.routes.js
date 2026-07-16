import { Router } from "express";
import { checkStock, listProducts } from "../services/inventory.service.js";

export const inventoryRoutes = Router();

inventoryRoutes.get("/products", (req, res) => {
  res.json({ products: listProducts() });
});

inventoryRoutes.post("/check", (req, res) => {
  const { productId, quantity, orderId, userId } = req.body || {};

  if (!productId || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: "INVALID_INPUT" });
  }

  const result = checkStock({ productId, quantity, orderId, userId });

  if (!result.ok) {
    return res.status(409).json(result);
  }
  res.json(result);
});
