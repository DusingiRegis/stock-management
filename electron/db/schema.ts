
import { getPool } from "./database";
import bcrypt from "bcryptjs";
import { dialog, app } from "electron";

export async function initDatabase(): Promise<void> {
  try {
    const pool = await getPool();

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
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT NOT NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        cost NUMERIC NOT NULL DEFAULT 0,
        low_stock_threshold INTEGER NOT NULL DEFAULT 10,
        brand TEXT,
        quality TEXT,
        unit TEXT NOT NULL DEFAULT 'Piece',
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(sku, store_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock (
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 0,
        last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY (product_id, store_id)
      )
    `);

    // Check if stock table needs migration to add store_id
    const stockColumnsResult = await pool.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'stock'
    `);
    const stockColumns = stockColumnsResult.rows.map((row: any) => row.column_name);

    if (!stockColumns.includes('store_id')) {
      // Migrate existing stock table to include store_id
      await pool.query(`
        ALTER TABLE stock 
        DROP CONSTRAINT IF EXISTS stock_pkey,
        ADD COLUMN store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE
      `);
      
      // Create default store first if needed
      const storeCountResult = await pool.query("SELECT COUNT(*) as count FROM stores");
      const storeCount = parseInt(storeCountResult.rows[0].count, 10);
      if (storeCount === 0) {
        await pool.query("INSERT INTO stores (name) VALUES ($1)", ["Store 1"]);
      }
      const defaultStoreResult = await pool.query("SELECT id FROM stores WHERE name = $1 LIMIT 1", ["Store 1"]);
      const defaultStoreId = defaultStoreResult.rows[0]?.id;
      
      if (defaultStoreId) {
        // Update existing stock to use default store
        await pool.query("UPDATE stock SET store_id = $1 WHERE store_id IS NULL", [defaultStoreId]);
      }
      
      // Make store_id NOT NULL and add new primary key
      await pool.query(`
        ALTER TABLE stock 
        ALTER COLUMN store_id SET NOT NULL,
        ADD PRIMARY KEY (product_id, store_id)
      `);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_transactions (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id),
        type TEXT NOT NULL CHECK(type IN ('stock_in','stock_out','adjustment')),
        quantity INTEGER NOT NULL,
        amount NUMERIC,
        buying_price NUMERIC,
        selling_price NUMERIC,
        note TEXT,
        performed_by INTEGER NOT NULL REFERENCES users(id),
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        action TEXT NOT NULL,
        details TEXT,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Add missing columns if they don't exist
    const productColumnsResult = await pool.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'products'
    `);
    const productColumns = productColumnsResult.rows.map((row: any) => row.column_name);

    if (!productColumns.includes('store_id')) {
      await pool.query('ALTER TABLE products ADD COLUMN store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE');
    }
    if (!productColumns.includes('brand')) {
      await pool.query('ALTER TABLE products ADD COLUMN brand TEXT');
    }
    if (!productColumns.includes('quality')) {
      await pool.query('ALTER TABLE products ADD COLUMN quality TEXT');
    }
    if (!productColumns.includes('unit')) {
      await pool.query("ALTER TABLE products ADD COLUMN unit TEXT NOT NULL DEFAULT 'pcs'");
    }
    if (!productColumns.includes('cost')) {
      await pool.query('ALTER TABLE products ADD COLUMN cost NUMERIC NOT NULL DEFAULT 0');
    }

    const transactionColumnsResult = await pool.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'stock_transactions'
    `);
    const transactionColumns = transactionColumnsResult.rows.map((row: any) => row.column_name);

    if (!transactionColumns.includes('store_id')) {
      await pool.query('ALTER TABLE stock_transactions ADD COLUMN store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE');
    }
    if (!transactionColumns.includes('amount')) {
      await pool.query('ALTER TABLE stock_transactions ADD COLUMN amount NUMERIC');
    }
    if (!transactionColumns.includes('buying_price')) {
      await pool.query('ALTER TABLE stock_transactions ADD COLUMN buying_price NUMERIC');
    }
    if (!transactionColumns.includes('selling_price')) {
      await pool.query('ALTER TABLE stock_transactions ADD COLUMN selling_price NUMERIC');
    }

    const auditColumnsResult = await pool.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'audit_log'
    `);
    const auditColumns = auditColumnsResult.rows.map((row: any) => row.column_name);

    if (!auditColumns.includes('store_id')) {
      await pool.query('ALTER TABLE audit_log ADD COLUMN store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE');
    }

    // Create default store if it doesn't exist
    const storeCountResult2 = await pool.query("SELECT COUNT(*) as count FROM stores");
    const storeCount2 = parseInt(storeCountResult2.rows[0].count, 10);
    if (storeCount2 === 0) {
      await pool.query("INSERT INTO stores (name) VALUES ($1)", ["Store 1"]);
    }

    // Get default store ID
    const defaultStoreResult2 = await pool.query("SELECT id FROM stores WHERE name = $1 LIMIT 1", ["Store 1"]);
    const defaultStoreId2 = defaultStoreResult2.rows[0]?.id;

    if (defaultStoreId2) {
      // Update existing products to use default store
      await pool.query("UPDATE products SET store_id = $1 WHERE store_id IS NULL", [defaultStoreId2]);
      
      // Update existing transactions to use default store
      await pool.query("UPDATE stock_transactions SET store_id = $1 WHERE store_id IS NULL", [defaultStoreId2]);
      
      // Update existing audit logs to use default store
      await pool.query("UPDATE audit_log SET store_id = $1 WHERE store_id IS NULL", [defaultStoreId2]);
    }

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

    // Seed default stores if needed
    const storeCountResult = await pool.query("SELECT COUNT(*) as count FROM stores");
    const storeCount = parseInt(storeCountResult.rows[0].count, 10);
    if (storeCount === 0) {
      await pool.query("INSERT INTO stores (name) VALUES ($1)", ["Store 1"]);
      await pool.query("INSERT INTO stores (name) VALUES ($1)", ["Store 2"]);
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    dialog.showErrorBox(
      "PostgreSQL Connection Error",
      `PostgreSQL must be installed and running!\n\n` +
      `Required:\n` +
      `• Host: localhost\n` +
      `• Port: 5432\n` +
      `• Database: inventory_db\n` +
      `• User: postgres\n\n` +
      `Error: ${errorMessage}`
    );
    app.quit();
  }
}
