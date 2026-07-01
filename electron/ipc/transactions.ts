
import { ipcMain } from "electron";
import { getPool } from "../db/database";
import type { Transaction, ApiResponse, TransactionFilter, UserRole } from "../../src/types";

export function registerTransactionHandlers(): void {
  ipcMain.handle(
    "transactions:getAll",
    async (_, filter?: TransactionFilter, storeId?: number): Promise<ApiResponse<Transaction[]>> => {
      try {
        const pool = await getPool();
        let query = `
          SELECT 
            t.*,
            p.name as product_name,
            u.username as performed_by_username
          FROM stock_transactions t
          JOIN products p ON t.product_id = p.id
          JOIN users u ON t.performed_by = u.id
          WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (storeId) {
          query += ` AND t.store_id = $${paramIndex}`;
          params.push(storeId);
          paramIndex++;
        }

        if (filter) {
          if (filter.start_date) {
            query += ` AND t.created_at >= $${paramIndex}`;
            params.push(filter.start_date);
            paramIndex++;
          }
          if (filter.end_date) {
            query += ` AND t.created_at <= $${paramIndex}`;
            params.push(`${filter.end_date} 23:59:59`);
            paramIndex++;
          }
          if (filter.product_id) {
            query += ` AND t.product_id = $${paramIndex}`;
            params.push(filter.product_id);
            paramIndex++;
          }
          if (filter.type) {
            query += ` AND t.type = $${paramIndex}`;
            params.push(filter.type);
            paramIndex++;
          }
          if (filter.user_id) {
            query += ` AND t.performed_by = $${paramIndex}`;
            params.push(filter.user_id);
            paramIndex++;
          }
        }

        query += ` ORDER BY t.created_at DESC`;

        const result = await pool.query(query, params);

        return { success: true, data: result.rows as Transaction[] };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to get transactions" };
      }
    }
  );

  ipcMain.handle("transactions:getToday", async (_, storeId?: number): Promise<ApiResponse<Transaction[]>> => {
    try {
      const pool = await getPool();
      const today = new Date().toISOString().split('T')[0];
      let query = `
        SELECT 
          t.*,
          p.name as product_name,
          u.username as performed_by_username
        FROM stock_transactions t
        JOIN products p ON t.product_id = p.id
        JOIN users u ON t.performed_by = u.id
        WHERE DATE(t.created_at) = $1
      `;
      const params: any[] = [today];

      if (storeId) {
        query += ` AND t.store_id = $2`;
        params.push(storeId);
      }

      query += ` ORDER BY t.created_at DESC`;
      
      const result = await pool.query(query, params);

      return { success: true, data: result.rows as Transaction[] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to get today's transactions" };
    }
  });

  ipcMain.handle(
    "transactions:delete",
    async (_, id: number, callerUserId: number): Promise<ApiResponse> => {
      const pool = await getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const callerResult = await client.query("SELECT role FROM users WHERE id = $1", [callerUserId]);
        const caller = callerResult.rows[0] as { role: UserRole } | undefined;

        if (!caller || !["super_admin", "admin"].includes(caller.role)) {
          await client.query('ROLLBACK');
          return { success: false, error: "Unauthorized" };
        }

        const transactionResult = await client.query(
          "SELECT t.*, p.name as product_name FROM stock_transactions t JOIN products p ON t.product_id = p.id WHERE t.id = $1", 
          [id]
        );
        const transaction = transactionResult.rows[0];

        await client.query("DELETE FROM stock_transactions WHERE id = $1", [id]);

        await client.query(
          "INSERT INTO audit_log (user_id, action, details, store_id) VALUES ($1, $2, $3, $4)",
          [callerUserId, "TRANSACTION_DELETE", `Deleted transaction for ${transaction?.product_name}`, transaction?.store_id]
        );

        await client.query('COMMIT');

        return { success: true };
      } catch (error) {
        await client.query('ROLLBACK');
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete transaction" };
      } finally {
        client.release();
      }
    }
  );
}
