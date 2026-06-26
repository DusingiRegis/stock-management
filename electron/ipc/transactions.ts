
import { ipcMain } from "electron";
import { getPool } from "../db/database";
import type { Transaction, ApiResponse, TransactionFilter } from "../../src/types";

export function registerTransactionHandlers(): void {
  ipcMain.handle(
    "transactions:getAll",
    async (_, filter?: TransactionFilter): Promise<ApiResponse<Transaction[]>> => {
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

  ipcMain.handle("transactions:getToday", async (): Promise<ApiResponse<Transaction[]>> => {
    try {
      const pool = await getPool();
      const today = new Date().toISOString().split("T")[0];
      const result = await pool.query(`
        SELECT 
          t.*,
          p.name as product_name,
          u.username as performed_by_username
        FROM stock_transactions t
        JOIN products p ON t.product_id = p.id
        JOIN users u ON t.performed_by = u.id
        WHERE DATE(t.created_at) = $1
        ORDER BY t.created_at DESC
      `, [today]);

      return { success: true, data: result.rows as Transaction[] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to get today's transactions" };
    }
  });
}
