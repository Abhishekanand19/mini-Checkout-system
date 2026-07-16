import { Router } from "express";
import { runCheckout } from "../services/checkout.service.js";
import { pool } from "../db.js";

export const checkoutRoutes = Router();

checkoutRoutes.post("/checkout", async (req, res, next) => {
  try {
    const { productId, quantity } = req.body || {};
    const qty = Number(quantity);

    if (!productId || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ error: "INVALID_INPUT" });
    }

    const result = await runCheckout({
      productId,
      quantity: qty,
      requestId: req.context.requestId,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

checkoutRoutes.get("/orders", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM orders ORDER BY created_at DESC LIMIT 20",
    );
    res.json({ orders: rows });
  } catch (err) {
    next(err);
  }
});
