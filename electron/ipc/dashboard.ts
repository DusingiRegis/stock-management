
import { ipcMain } from "electron";
import { getPool } from "../db/database";
import type { DashboardStats, Product, Transaction, ApiResponse } from "../../src/types";

export function registerDashboardHandlers(): void {
  ipcMain.handle("dashboard:getStats", async (_, storeId?: number): Promise<ApiResponse<DashboardStats>> => {
    try {
      const pool = await getPool();
      
      let productQuery = "SELECT COUNT(*) as count FROM products";
      let stockQuery = "SELECT SUM(s.quantity) as count FROM stock s JOIN products p ON s.product_id = p.id";
      let lowStockQuery = `
        SELECT COUNT(*) as count
        FROM products p
        LEFT JOIN stock s ON p.id = s.product_id ${storeId ? "AND s.store_id = " + storeId : ""}
        WHERE COALESCE(s.quantity, 0) <= p.low_stock_threshold
      `;
      const today = new Date().toISOString().split('T')[0];
      let todayTransQuery = "SELECT COUNT(*) as count FROM stock_transactions WHERE DATE(created_at) = $1";
      let revenueQuery = "SELECT COALESCE(SUM(amount), 0) as total FROM stock_transactions WHERE type = 'stock_out'";
      let costQuery = "SELECT COALESCE(SUM(amount), 0) as total FROM stock_transactions WHERE type = 'stock_in'";

      const params: any[] = [today];
      let paramIndex = 2;

      if (storeId) {
        productQuery += " WHERE store_id = $1";
        stockQuery += " WHERE p.store_id = $1 AND s.store_id = $1";
        lowStockQuery += " AND p.store_id = $2";
        todayTransQuery += " AND store_id = $2";
        revenueQuery += " AND store_id = $3";
        costQuery += " AND store_id = $4";
        params.unshift(storeId, storeId, storeId);
        paramIndex += 3;
      }

      const totalProductsResult = await pool.query(productQuery, storeId ? [storeId] : []);
      const totalStockResult = await pool.query(stockQuery, storeId ? [storeId] : []);
      const todayTransactionsResult = await pool.query(todayTransQuery, params.slice(0, 2));
      const lowStockCountResult = await pool.query(lowStockQuery, storeId ? [storeId] : []);
      
      const revenueResult = await pool.query(revenueQuery, storeId ? [storeId] : []);
      const costResult = await pool.query(costQuery, storeId ? [storeId] : []);

      const totalRevenue = parseFloat(revenueResult.rows[0].total || 0);
      const totalCost = parseFloat(costResult.rows[0].total || 0);

      const stats: DashboardStats = {
        totalProducts: parseInt(totalProductsResult.rows[0].count, 10),
        totalStockValue: parseInt(totalStockResult.rows[0].count || 0, 10),
        lowStockCount: parseInt(lowStockCountResult.rows[0].count, 10),
        todayTransactions: parseInt(todayTransactionsResult.rows[0].count, 10),
        totalRevenue,
        totalCost,
        netProfit: totalRevenue - totalCost,
      };

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to get dashboard stats" };
    }
  });

  ipcMain.handle("dashboard:getLowStock", async (_, storeId?: number): Promise<ApiResponse<Product[]>> => {
    try {
      const pool = await getPool();
      let query = `
        SELECT 
          p.*,
          c.name as category_name,
          COALESCE(s.quantity, 0) as current_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN stock s ON p.id = s.product_id ${storeId ? "AND s.store_id = " + storeId : ""}
        WHERE COALESCE(s.quantity, 0) <= p.low_stock_threshold
      `;
      const params: any[] = [];

      if (storeId) {
        query += " AND p.store_id = $1";
        params.push(storeId);
      }

      query += " ORDER BY (COALESCE(s.quantity, 0) * 1.0 / p.low_stock_threshold) ASC";

      const result = await pool.query(query, params);

      const processedProducts = result.rows.map(product => {
        let status: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
        if (product.current_stock === 0) status = "out_of_stock";
        else if (product.current_stock <= product.low_stock_threshold) status = "low_stock";
        return { ...product, status };
      });

      return { success: true, data: processedProducts as Product[] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to get low stock products" };
    }
  });

  ipcMain.handle("dashboard:getRecentTransactions", async (_, storeId?: number): Promise<ApiResponse<Transaction[]>> => {
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

      if (storeId) {
        query += " AND t.store_id = $1";
        params.push(storeId);
      }

      query += " ORDER BY t.created_at DESC LIMIT 10";

      const result = await pool.query(query, params);

      return { success: true, data: result.rows as Transaction[] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to get recent transactions" };
    }
  });
}
