
import { ipcMain } from "electron";
import { getPool } from "../db/database";
import type { StockInPayload, StockOutPayload, AdjustStockPayload, Transaction, ApiResponse, UserRole } from "../../src/types";

export function registerStockHandlers(): void {
  ipcMain.handle(
    "stock:addIn",
    async (_, payload: StockInPayload, callerUserId: number): Promise<ApiResponse<Transaction>> => {
      const pool = getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const callerResult = await client.query("SELECT role FROM users WHERE id = $1", [callerUserId]);
        const caller = callerResult.rows[0] as { role: UserRole } | undefined;
        
        if (!caller || !["super_admin", "admin", "manager", "staff"].includes(caller.role)) {
          await client.query('ROLLBACK');
          return { success: false, error: "Unauthorized" };
        }

        await client.query(
          "UPDATE stock SET quantity = quantity + $1, last_updated = NOW() WHERE product_id = $2",
          [payload.quantity, payload.product_id]
        );

        const insertResult = await client.query(
          "INSERT INTO stock_transactions (product_id, type, quantity, note, performed_by) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [payload.product_id, "stock_in", payload.quantity, payload.note || null, callerUserId]
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
          "INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)",
          [callerUserId, "STOCK_IN", `Added ${payload.quantity} units to product id ${payload.product_id}`]
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
    async (_, payload: StockOutPayload, callerUserId: number): Promise<ApiResponse<Transaction>> => {
      const pool = getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const callerResult = await client.query("SELECT role FROM users WHERE id = $1", [callerUserId]);
        const caller = callerResult.rows[0] as { role: UserRole } | undefined;
        
        if (!caller || !["super_admin", "admin", "manager", "staff"].includes(caller.role)) {
          await client.query('ROLLBACK');
          return { success: false, error: "Unauthorized" };
        }

        const stockResult = await client.query("SELECT quantity FROM stock WHERE product_id = $1", [payload.product_id]);
        const stock = stockResult.rows[0];

        if (!stock || stock.quantity < payload.quantity) {
          await client.query('ROLLBACK');
          return { success: false, error: "Insufficient stock" };
        }

        await client.query(
          "UPDATE stock SET quantity = quantity - $1, last_updated = NOW() WHERE product_id = $2",
          [payload.quantity, payload.product_id]
        );

        const insertResult = await client.query(
          "INSERT INTO stock_transactions (product_id, type, quantity, note, performed_by) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [payload.product_id, "stock_out", payload.quantity, payload.note || null, callerUserId]
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
          "INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)",
          [callerUserId, "STOCK_OUT", `Removed ${payload.quantity} units from product id ${payload.product_id}`]
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
    async (_, payload: AdjustStockPayload, callerUserId: number): Promise<ApiResponse<Transaction>> => {
      const pool = getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const callerResult = await client.query("SELECT role FROM users WHERE id = $1", [callerUserId]);
        const caller = callerResult.rows[0] as { role: UserRole } | undefined;
        
        if (!caller || !["super_admin", "admin", "manager"].includes(caller.role)) {
          await client.query('ROLLBACK');
          return { success: false, error: "Unauthorized" };
        }

        await client.query(
          "UPDATE stock SET quantity = $1, last_updated = NOW() WHERE product_id = $2",
          [payload.quantity, payload.product_id]
        );

        const insertResult = await client.query(
          "INSERT INTO stock_transactions (product_id, type, quantity, note, performed_by) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [payload.product_id, "adjustment", payload.quantity, payload.note || null, callerUserId]
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
          "INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)",
          [callerUserId, "STOCK_ADJUST", `Adjusted product id ${payload.product_id} to ${payload.quantity} units`]
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
