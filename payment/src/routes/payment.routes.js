import { Router } from "express";
import { processPayment } from "../services/payment.service.js";

export const paymentRoutes = Router();

paymentRoutes.post("/charge", async (req, res, next) => {
  try {
    const { amount, orderId, userId, method } = req.body || {};

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "INVALID_AMOUNT" });
    }

    const result = await processPayment({
      amount,
      orderId,
      userId,
      method,
      requestId: req.context.requestId,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});
