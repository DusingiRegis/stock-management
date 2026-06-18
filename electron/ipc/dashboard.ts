
import { ipcMain } from "electron";
import { getPool } from "../db/database";
import type { DashboardStats, Product, Transaction, ApiResponse } from "../../src/types";

export function registerDashboardHandlers(): void {
  ipcMain.handle("dashboard:getStats", async (): Promise<ApiResponse<DashboardStats>> => {
    try {
      const pool = getPool();
      const totalProductsResult = await pool.query("SELECT COUNT(*) as count FROM products");
      const totalStockResult = await pool.query("SELECT SUM(quantity) as count FROM stock");
      const today = new Date().toISOString().split("T")[0];
      const todayTransactionsResult = await pool.query(
        "SELECT COUNT(*) as count FROM stock_transactions WHERE DATE(created_at) = $1",
        [today]
      );
      const lowStockCountResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM products p
        LEFT JOIN stock s ON p.id = s.product_id
        WHERE COALESCE(s.quantity, 0) <= p.low_stock_threshold
      `);

      const stats: DashboardStats = {
        totalProducts: parseInt(totalProductsResult.rows[0].count, 10),
        totalStockValue: parseInt(totalStockResult.rows[0].count || 0, 10),
        lowStockCount: parseInt(lowStockCountResult.rows[0].count, 10),
        todayTransactions: parseInt(todayTransactionsResult.rows[0].count, 10),
      };

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to get dashboard stats" };
    }
  });

  ipcMain.handle("dashboard:getLowStock", async (): Promise<ApiResponse<Product[]>> => {
    try {
      const pool = getPool();
      const result = await pool.query(`
        SELECT 
          p.*,
          c.name as category_name,
          COALESCE(s.quantity, 0) as current_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN stock s ON p.id = s.product_id
        WHERE COALESCE(s.quantity, 0) <= p.low_stock_threshold
        ORDER BY (COALESCE(s.quantity, 0) * 1.0 / p.low_stock_threshold) ASC
      `);

      return { success: true, data: result.rows as Product[] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to get low stock products" };
    }
  });

  ipcMain.handle("dashboard:getRecentTransactions", async (): Promise<ApiResponse<Transaction[]>> => {
    try {
      const pool = getPool();
      const result = await pool.query(`
        SELECT 
          t.*,
          p.name as product_name,
          u.username as performed_by_username
        FROM stock_transactions t
        JOIN products p ON t.product_id = p.id
        JOIN users u ON t.performed_by = u.id
        ORDER BY t.created_at DESC
        LIMIT 10
      `);

      return { success: true, data: result.rows as Transaction[] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to get recent transactions" };
    }
  });
}
