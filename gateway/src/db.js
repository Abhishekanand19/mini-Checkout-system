import pg from "pg";
import { config } from "./config.js";

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 5,
});

pool.on("error", (err) =>
  console.error(`[${config.serviceName}] pg pool error`, err),
);

export async function insertOrder({ productName, quantity, price, status }) {
  const { rows } = await pool.query(
    `INSERT INTO orders (product_name, quantity, price, status)
     VALUES ($1, $2, $3, $4)
     RETURNING id, product_name, quantity, price, status, created_at`,
    [productName, quantity, price, status],
  );
  return rows[0];
}
