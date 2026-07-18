# Mini Checkout System

A small distributed checkout flow, instrumented end-to-end with OpenTelemetry
and traced in SigNoz. One "Buy Now" click produces one distributed trace across
four services and a database.

Built for [blog post title](#) — [walkthrough video](#).

## Architecture

```
React (5173)
    │
    ▼
Gateway (4000) ──┬──▶ Inventory     (4001)   catalog + stock check
                 ├──▶ Payment       (4002)   simulated provider, ~400ms
                 ├──▶ Notification  (4003)   simulated confirmation, ~200ms
                 └──▶ PostgreSQL    (5432)   orders table
```

Gateway is the only service that fans out and the only one that touches the DB.
The others are leaves — they call nothing.

## Stack

React 18 + Vite · Node 20 + Express 4 (ESM) · PostgreSQL 16 · Docker Compose
OpenTelemetry auto-instrumentation · Pino · SigNoz (self-hosted)

## Prerequisites

- Docker Desktop
- A running SigNoz instance with OTLP on `:4318` — see [SigNoz install docs](https://signoz.io/docs/install/docker/)

Without SigNoz, the app still runs. You just won't see traces.

## Run

```bash
cp .env.example .env
docker compose up --build
```

Open <http://localhost:5173>, click **Buy Now**.
Traces land at <http://localhost:8080>.

## Verify

```bash
# health
for p in 4000 4001 4002 4003; do curl -s http://localhost:$p/health; echo; done

# one checkout
curl -X POST http://localhost:4000/api/checkout \
  -H "content-type: application/json" \
  -d '{"productId":"prod-001","quantity":3}'

# orders
curl http://localhost:4000/api/orders
```

In SigNoz: **Traces** → filter `name = 'POST /api/checkout'` → open the newest.
Expect four services in one waterfall.

## Instrumentation

**There is no `tracing.js`.** Zero instrumentation code. It's env vars in
`docker-compose.yml`:

```yaml
OTEL_SERVICE_NAME: payment-service
OTEL_TRACES_EXPORTER: otlp
OTEL_LOGS_EXPORTER: otlp
OTEL_EXPORTER_OTLP_PROTOCOL: http/protobuf
OTEL_EXPORTER_OTLP_ENDPOINT: http://host.docker.internal:4318
OTEL_NODE_DISABLED_INSTRUMENTATIONS: fs
NODE_OPTIONS: "--experimental-loader=@opentelemetry/instrumentation/hook.mjs --import @opentelemetry/auto-instrumentations-node/register"
```

**ESM gotcha:** these services are `"type": "module"`. `import "./tracing.js"`
does nothing in ESM — no error, no traces. You need *both* `NODE_OPTIONS` flags.
`--import ./tracing.mjs` alone isn't enough; `--require` is CJS-only.

**Don't** put `/v1/traces` on `OTEL_EXPORTER_OTLP_ENDPOINT` — the exporter
appends it.

**Don't** skip `OTEL_NODE_DISABLED_INSTRUMENTATIONS: fs` — filesystem spans
will bury the trace.

## Custom span attributes

| Service | Attributes |
|---|---|
| gateway | `order.id` `user.id` `cart.items` `checkout.total` `checkout.currency` |
| inventory | `inventory.items_checked` `inventory.available` `inventory.warehouse` |
| payment | `payment.provider` `payment.method` `payment.amount` `payment.currency` `payment.status` |
| notification | `notification.channel` `notification.template` `notification.recipient` |

Set via `trace.getActiveSpan()` — which inside an Express handler is the
`request handler - /path` span, **not** the `POST /path` root. Filter on the
former to see them.

Every service also stamps `order.id`, so `order.id = 'ORD-4821'` returns the
whole distributed request.

## Logs

Pino, auto-correlated. `@opentelemetry/instrumentation-pino` injects `trace_id`
and `span_id` into every line and ships them via OTLP. Trace → **Related Logs**
in SigNoz filters to that one request.

Business events only (`info`). Middleware timing is `debug` and off by default.

## API

| Endpoint | Returns |
|---|---|
| `POST /api/checkout` `{productId, quantity}` | `201` + order, `orderRef`, `transactionId`, `notified` |
| `GET /api/orders` | last 20 |
| `GET /health` | per-service liveness |

## Products

| productId | Name | Price | Stock |
|---|---|---:|---:|
| `prod-001` | Mechanical Keyboard | 4999 | 100000 |
| `prod-002` | Noise Cancelling Headphones | 8999 | 100000 |

In-memory, resets on restart.

## Tuning the bottleneck

The payment delay drives the whole demo. In the `payment` block:

```yaml
PAYMENT_DELAY_MS: 400     # base
PAYMENT_JITTER_MS: 100    # random 0-N added on top
```

| Setting | Checkout | Payment share |
|---|---:|---:|
| `2000` / `0` | ~2.2 s | ~90% |
| `3000` / `500` | ~3.7 s | ~94% |
| `400` / `100` | ~705 ms | ~66% |

Jitter matters — a flat delay makes P50 and P99 identical, which no real
dependency does.

`docker compose up -d payment` picks up the change. No rebuild.

## Known limits (deliberate)

- Inventory decrements stock at check time with **no rollback** if payment
  fails. Visible in traces as an orphaned reservation.
- Notification failure is **non-fatal** — a paid order still returns `201`
  with `notified: false`.
- Payment is a `setTimeout`. It models the *shape* of a slow dependency, not
  its variance or failure modes.
- First request after `--build` is ~1.5s slower. Container cold start, not a
  bottleneck. Ignore the top of a duration-sorted list.

## Reset

```bash
docker compose down -v   # -v drops pgdata so the init script re-runs
```