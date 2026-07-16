import { config } from "../config.js";

/**
 * EVERY outbound call goes through here. Single network edge.
 * PHASE 2 SEAM: header injection for traceparent happens right here,
 * and this is where the client span will be created.
 */
export async function callService({
  name,
  url,
  body,
  requestId,
  timeoutMs = 10000,
}) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": requestId, // manual correlation until traceparent exists
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = await res.json().catch(() => ({}));
    const ms = Date.now() - startedAt;

    console.log(
      `[${config.serviceName}] -> ${name} ${res.status} ${ms}ms req=${requestId}`,
    );

    if (!res.ok) {
      const err = new Error(`${name.toUpperCase()}_FAILED`);
      err.status = res.status;
      err.downstream = name;
      err.payload = payload;
      throw err;
    }

    return payload;
  } catch (err) {
    if (err.name === "AbortError") {
      const e = new Error(`${name.toUpperCase()}_TIMEOUT`);
      e.status = 504;
      e.downstream = name;
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
