
import { ipcMain, dialog } from "electron";
import fs from "fs";
import type { ApiResponse, TransactionFilter, ProfitLossStats, Transaction } from "../../src/types";
import { getPool } from "../db/database";

export function registerReportHandlers(): void {
  ipcMain.handle(
    "reports:export",
    async (_, data: Record<string, string>[], filename: string): Promise<ApiResponse> => {
      try {
        const { filePath } = await dialog.showSaveDialog({
          defaultPath: filename,
          filters: [{ name: "CSV Files", extensions: ["csv"] }],
        });

        if (!filePath) {
          return { success: false, error: "No file selected" };
        }

        if (data.length === 0) {
          return { success: false, error: "No data to export" };
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
          headers.join(","),
          ...data.map((row) => headers.map((header) => `"${row[header] || ""}"`).join(",")),
        ].join("\n");

        fs.writeFileSync(filePath, csvContent);

        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to export" };
      }
    }
  );

  ipcMain.handle(
    "reports:getProfitLoss",
    async (_, filter?: TransactionFilter, storeId?: number): Promise<ApiResponse<ProfitLossStats>> => {
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
        const transactions = result.rows as Transaction[];

        const totalRevenue = transactions
          .filter(t => t.type === 'stock_out')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalCost = transactions
          .filter(t => t.type === 'stock_in')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        return {
          success: true,
          data: {
            totalRevenue,
            totalCost,
            netProfit: totalRevenue - totalCost,
            transactions,
          },
        };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to get profit loss" };
      }
    }
  );
}
