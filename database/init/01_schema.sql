CREATE TABLE IF NOT EXISTS orders (
    id           SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    quantity     INTEGER      NOT NULL CHECK (quantity > 0),
    price        NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    status       VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);