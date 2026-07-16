import { useState } from "react";
import { checkout } from "./api.js";

const PRODUCT = {
  productId: "prod-001",
  name: "Mechanical Keyboard",
  price: 4999,
};

export default function App() {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  async function handleBuy() {
    setStatus("loading");
    setError("");
    try {
      const { data, requestId } = await checkout({
        productId: PRODUCT.productId,
        quantity: 1,
      });
      setOrder({ ...data, requestId });
      setStatus("success");
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <main className="wrap">
        <div className="card">
          <h1 className="ok">Order Successful</h1>
          <p>
            <strong>Order ID:</strong> {order.orderId}
          </p>
          <p>
            <strong>Product:</strong> {order.productName}
          </p>
          <p>
            <strong>Paid:</strong> ₹{order.price}
          </p>
          <p>
            <strong>Status:</strong> {order.status}
          </p>
          <p>
            <strong>Txn:</strong> {order.transactionId}
          </p>
          <p className="muted">req: {order.requestId}</p>
          <button onClick={() => setStatus("idle")}>Buy again</button>
        </div>
      </main>
    );
  }

  return (
    <main className="wrap">
      <div className="card">
        <div className="thumb">IMAGE</div>
        <h2>{PRODUCT.name}</h2>
        <p className="price">₹{PRODUCT.price}</p>

        <button onClick={handleBuy} disabled={status === "loading"}>
          {status === "loading" ? "Processing payment..." : "Buy Now"}
        </button>

        {status === "error" && <p className="err">Failed: {error}</p>}
      </div>
    </main>
  );
}
