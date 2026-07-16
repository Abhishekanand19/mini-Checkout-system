import { Router } from "express";
import { sendConfirmation } from "../services/notification.service.js";

export const notificationRoutes = Router();

notificationRoutes.post("/send", async (req, res, next) => {
  try {
    const { productName, transactionId, orderId, userId } = req.body || {};

    if (!productName) {
      return res.status(400).json({ error: "INVALID_INPUT" });
    }

    const result = await sendConfirmation({
      productName,
      transactionId,
      orderId,
      userId,
      requestId: req.context.requestId,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});
