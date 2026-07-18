# Performance Comparison

All numbers read from SigNoz → Services, P99 over the sampling window.
Sample size: 10–15 checkouts per state. Load: sequential, ~400ms apart.

## End-to-end

| Metric | Healthy | Slow | Fixed |
|---|---:|---:|---:|
| Checkout (client-observed mean) | __ s | __ s | __ s |
| gateway-service P99 | __ s | __ s | __ s |
| gateway-service P50 | __ s | __ s | __ s |

## Per service (P99)

| Service | Healthy | Slow | Fixed |
|---|---:|---:|---:|
| gateway-service | __ s | __ s | __ s |
| payment-service | __ s | __ s | __ s |
| inventory-service | __ ms | __ ms | __ ms |
| notification-service | __ ms | __ ms | __ ms |

## Share of trace duration

| Service | Healthy | Slow | Fixed |
|---|---:|---:|---:|
| payment-service | ~90% | ~94% | ~67% |
| notification-service | ~9% | ~5% | ~29% |
| inventory-service | ~0.2% | ~0.1% | ~0.6% |
| gateway-service | ~0.5% | ~1% | ~3% |

## What changed

One environment variable in the payment service: `PAYMENT_DELAY_MS`.
No change to inventory, notification, gateway, or the database.

## What the investigation cost

| Step | Screen |
|---|---|
| Confirm checkout is slow | Services |
| Identify which service | Services (P99 column) |
| Confirm it is not the DB | Trace waterfall (`pg.query` span) |
| Confirm the operation | Payment span attributes |
| Confirm the delay is inside payment | Related Logs timestamp gap |

Four screens. No code read. No log grepping.

## Caveats

- Sample sizes are small (10–15 requests). P99 on 15 samples is the slowest
  request, not a real P99. Directionally valid, not statistically rigorous.
- Load is sequential, not concurrent. No queueing effects are represented.
- The bottleneck was a `setTimeout`, not real provider latency. It models the
  *shape* of a slow downstream dependency, not its variance or failure modes.
- The "fix" reduced a simulated delay. It is not an optimization technique.
  What generalizes here is the investigation path, not the remedy.

## The finding that was not planned

At 2s payment, notification's 200ms was 9% of the trace — invisible.
At 400ms payment, the same 200ms is 29%. Fixing the loudest bottleneck
does not make a system fast; it just promotes the next one.