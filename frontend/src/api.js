const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || "http://localhost:4000";

export async function checkout({ productId, quantity }) {
  const res = await fetch(`${GATEWAY_URL}/api/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "CHECKOUT_FAILED");

  // Phase 2: this header becomes the trace id you paste into SigNoz.
  return { data, requestId: res.headers.get("x-request-id") };
}
