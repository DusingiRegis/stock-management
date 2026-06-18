
import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: "localhost",
      port: 5432,
      database: "inventory_db",
      user: "postgres",
      password: "admin123",
    });
  }
  return pool;
}

export default getPool;
