# Checkout System — Phase 1

A minimal distributed checkout flow, built to be instrumented with
OpenTelemetry + SigNoz in Phase 2. Phase 1 has **no** tracing, metrics,
or logging beyond `console.log`.

## Architecture
React (5173) → Gateway (4000) → Inventory   (4001)
→ Payment     (4002)  [~2s simulated delay]
→ Notification (4003)
→ PostgreSQL  (5432)
Gateway is the only service that fans out and the only one that touches the DB.

## Services

| Service      | Port | Responsibility                              |
|--------------|------|---------------------------------------------|
| frontend     | 5173 | One product card, Buy Now button            |
| gateway      | 4000 | Orchestrates the flow, writes the order     |
| inventory    | 4001 | Catalog + stock check (in-memory)           |
| payment      | 4002 | Simulated payment, 2s delay                 |
| notification | 4003 | Simulated confirmation send                 |
| postgres     | 5432 | `orders` table                              |

## Run

```bash
docker compose up --build
```

Open http://localhost:5173 and click **Buy Now**.

## Verify

```bash
curl http://localhost:4000/health
curl http://localhost:4001/health
curl http://localhost:4002/health
curl http://localhost:4003/health

curl -X POST http://localhost:4000/api/checkout \
  -H "content-type: application/json" \
  -d '{"productId":"prod-001","quantity":1}'

curl http://localhost:4000/api/orders
```

Check the DB:

```bash
docker exec -it checkout-postgres psql -U checkout -d checkoutdb \
  -c "SELECT * FROM orders ORDER BY id DESC LIMIT 5;"
```

## API

**POST /api/checkout** — `{ productId, quantity }` → `201` with order details
**GET  /api/orders** — last 20 orders
**GET  /health** — per-service liveness

## Products

| productId | Name                        | Price | Stock |
|-----------|-----------------------------|-------|-------|
| prod-001  | Mechanical Keyboard         | 4999  | 25    |
| prod-002  | Noise Cancelling Headphones | 8999  | 3     |

Stock is in-memory and resets on container restart. Intentional for Phase 1.

## Notes / known limits

- Inventory decrements stock on check with no rollback if payment fails.
  Deliberate — Phase 2 will show this as an orphaned reservation in traces.
- Notification failures are non-fatal; a paid order still succeeds.
- `x-request-id` is manual correlation. Phase 2 replaces it with `traceparent`.

## Reset

```bash
docker compose down -v   # -v drops pgdata so the init script re-runs
```