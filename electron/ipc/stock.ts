
import { ipcMain } from "electron";
import { getPool } from "../db/database";
import type { StockTransactionPayload, Transaction, ApiResponse, UserRole } from "../../src/types";

export function registerStockHandlers(): void {
  ipcMain.handle(
    "stock:addIn",
    async (_, payload: StockTransactionPayload, callerUserId: number, storeId: number): Promise<ApiResponse<Transaction>> => {
      const pool = await getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const callerResult = await client.query("SELECT role FROM users WHERE id = $1", [callerUserId]);
        const caller = callerResult.rows[0] as { role: UserRole } | undefined;
        
        if (!caller || !["super_admin", "admin", "manager", "staff"].includes(caller.role)) {
          await client.query('ROLLBACK');
          return { success: false, error: "Unauthorized" };
        }

        // Check if stock entry exists for this product and store
        const stockCheck = await client.query(
          "SELECT quantity FROM stock WHERE product_id = $1 AND store_id = $2",
          [payload.product_id, storeId]
        );
        
        if (stockCheck.rows.length === 0) {
          await client.query(
            "INSERT INTO stock (product_id, store_id, quantity, last_updated) VALUES ($1, $2, $3, NOW())",
            [payload.product_id, storeId, payload.quantity]
          );
        } else {
          await client.query(
            "UPDATE stock SET quantity = quantity + $1, last_updated = NOW() WHERE product_id = $2 AND store_id = $3",
            [payload.quantity, payload.product_id, storeId]
          );
        }

        const insertResult = await client.query(
          "INSERT INTO stock_transactions (product_id, type, quantity, amount, buying_price, selling_price, note, performed_by, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
          [
            payload.product_id, 
            "stock_in", 
            payload.quantity, 
            payload.amount || null, 
            payload.buying_price || null, 
            payload.selling_price || null,
            payload.note || null, 
            callerUserId,
            storeId
          ]
        );
        const transactionId = insertResult.rows[0].id;

        const transactionResult = await client.query(`
          SELECT 
            t.*,
            p.name as product_name,
            u.username as performed_by_username
          FROM stock_transactions t
          JOIN products p ON t.product_id = p.id
          JOIN users u ON t.performed_by = u.id
          WHERE t.id = $1
        `, [transactionId]);
        const transaction = transactionResult.rows[0];

        await client.query(
          "INSERT INTO audit_log (user_id, action, details, store_id) VALUES ($1, $2, $3, $4)",
          [callerUserId, "STOCK_IN", `Added ${payload.quantity} units to product id ${payload.product_id}`, storeId]
        );

        await client.query('COMMIT');

        return { success: true, data: transaction as Transaction };
      } catch (error) {
        await client.query('ROLLBACK');
        return { success: false, error: error instanceof Error ? error.message : "Failed to add stock" };
      } finally {
        client.release();
      }
    }
  );

  ipcMain.handle(
    "stock:addOut",
    async (_, payload: StockTransactionPayload, callerUserId: number, storeId: number): Promise<ApiResponse<Transaction>> => {
      const pool = await getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const callerResult = await client.query("SELECT role FROM users WHERE id = $1", [callerUserId]);
        const caller = callerResult.rows[0] as { role: UserRole } | undefined;
        
        if (!caller || !["super_admin", "admin", "manager", "staff"].includes(caller.role)) {
          await client.query('ROLLBACK');
          return { success: false, error: "Unauthorized" };
        }

        const stockResult = await client.query(
          "SELECT quantity FROM stock WHERE product_id = $1 AND store_id = $2",
          [payload.product_id, storeId]
        );
        const stock = stockResult.rows[0];

        if (!stock || stock.quantity < payload.quantity) {
          await client.query('ROLLBACK');
          return { success: false, error: "Insufficient stock" };
        }

        await client.query(
          "UPDATE stock SET quantity = quantity - $1, last_updated = NOW() WHERE product_id = $2 AND store_id = $3",
          [payload.quantity, payload.product_id, storeId]
        );

        const insertResult = await client.query(
          "INSERT INTO stock_transactions (product_id, type, quantity, amount, buying_price, selling_price, note, performed_by, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
          [
            payload.product_id, 
            "stock_out", 
            payload.quantity, 
            payload.amount || null, 
            payload.buying_price || null, 
            payload.selling_price || null,
            payload.note || null, 
            callerUserId,
            storeId
          ]
        );
        const transactionId = insertResult.rows[0].id;

        const transactionResult = await client.query(`
          SELECT 
            t.*,
            p.name as product_name,
            u.username as performed_by_username
          FROM stock_transactions t
          JOIN products p ON t.product_id = p.id
          JOIN users u ON t.performed_by = u.id
          WHERE t.id = $1
        `, [transactionId]);
        const transaction = transactionResult.rows[0];

        await client.query(
          "INSERT INTO audit_log (user_id, action, details, store_id) VALUES ($1, $2, $3, $4)",
          [callerUserId, "STOCK_OUT", `Removed ${payload.quantity} units from product id ${payload.product_id}`, storeId]
        );

        await client.query('COMMIT');

        return { success: true, data: transaction as Transaction };
      } catch (error) {
        await client.query('ROLLBACK');
        return { success: false, error: error instanceof Error ? error.message : "Failed to remove stock" };
      } finally {
        client.release();
      }
    }
  );

  ipcMain.handle(
    "stock:adjust",
    async (_, payload: StockTransactionPayload, callerUserId: number, storeId: number): Promise<ApiResponse<Transaction>> => {
      const pool = await getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const callerResult = await client.query("SELECT role FROM users WHERE id = $1", [callerUserId]);
        const caller = callerResult.rows[0] as { role: UserRole } | undefined;
        
        if (!caller || !["super_admin", "admin", "manager"].includes(caller.role)) {
          await client.query('ROLLBACK');
          return { success: false, error: "Unauthorized" };
        }

        // Check if stock entry exists for this product and store
        const stockCheck = await client.query(
          "SELECT quantity FROM stock WHERE product_id = $1 AND store_id = $2",
          [payload.product_id, storeId]
        );
        
        if (stockCheck.rows.length === 0) {
          await client.query(
            "INSERT INTO stock (product_id, store_id, quantity, last_updated) VALUES ($1, $2, $3, NOW())",
            [payload.product_id, storeId, payload.quantity]
          );
        } else {
          await client.query(
            "UPDATE stock SET quantity = $1, last_updated = NOW() WHERE product_id = $2 AND store_id = $3",
            [payload.quantity, payload.product_id, storeId]
          );
        }

        const insertResult = await client.query(
          "INSERT INTO stock_transactions (product_id, type, quantity, amount, buying_price, selling_price, note, performed_by, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
          [
            payload.product_id, 
            "adjustment", 
            payload.quantity, 
            payload.amount || null, 
            payload.buying_price || null, 
            payload.selling_price || null,
            payload.note || null, 
            callerUserId,
            storeId
          ]
        );
        const transactionId = insertResult.rows[0].id;

        const transactionResult = await client.query(`
          SELECT 
            t.*,
            p.name as product_name,
            u.username as performed_by_username
          FROM stock_transactions t
          JOIN products p ON t.product_id = p.id
          JOIN users u ON t.performed_by = u.id
          WHERE t.id = $1
        `, [transactionId]);
        const transaction = transactionResult.rows[0];

        await client.query(
          "INSERT INTO audit_log (user_id, action, details, store_id) VALUES ($1, $2, $3, $4)",
          [callerUserId, "STOCK_ADJUST", `Adjusted product id ${payload.product_id} to ${payload.quantity} units`, storeId]
        );

        await client.query('COMMIT');

        return { success: true, data: transaction as Transaction };
      } catch (error) {
        await client.query('ROLLBACK');
        return { success: false, error: error instanceof Error ? error.message : "Failed to adjust stock" };
      } finally {
        client.release();
      }
    }
  );
}
