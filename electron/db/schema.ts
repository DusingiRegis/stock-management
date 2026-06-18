
import { getPool } from "./database";
import bcrypt from "bcryptjs";

export async function initDatabase(): Promise<void> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('super_admin','admin','manager','staff')),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      unit TEXT NOT NULL DEFAULT 'pcs',
      low_stock_threshold INTEGER NOT NULL DEFAULT 10,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock (
      product_id INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 0,
      last_updated TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_transactions (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id),
      type TEXT NOT NULL CHECK(type IN ('stock_in','stock_out','adjustment')),
      quantity INTEGER NOT NULL,
      note TEXT,
      performed_by INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      details TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Seed data if needed
  const userCountResult = await pool.query("SELECT COUNT(*) as count FROM users");
  const userCount = parseInt(userCountResult.rows[0].count, 10);
  if (userCount === 0) {
    const passwordHash = bcrypt.hashSync("Admin@1234", 10);
    await pool.query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
      ["superadmin", passwordHash, "super_admin"]
    );
  }

  const settingsCountResult = await pool.query("SELECT COUNT(*) as count FROM settings");
  const settingsCount = parseInt(settingsCountResult.rows[0].count, 10);
  if (settingsCount === 0) {
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ($1, $2)",
      ["low_stock_threshold", "10"]
    );
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ($1, $2)",
      ["company_name", "My Company"]
    );
  }
}
