
import { ipcMain } from "electron";
import { getPool } from "../db/database";
import type {
  Category,
  AddCategoryPayload,
  ApiResponse,
  UserRole,
} from "../../src/types";

export function registerCategoryHandlers(): void {
  ipcMain.handle("categories:getAll", async (): Promise<ApiResponse<Category[]>> => {
    try {
      const pool = getPool();
      const result = await pool.query(`
        SELECT 
          c.*,
          COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        GROUP BY c.id
        ORDER BY c.name
      `);

      return { success: true, data: result.rows as Category[] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to get categories" };
    }
  });

  ipcMain.handle(
    "categories:add",
    async (_, payload: AddCategoryPayload, callerUserId: number): Promise<ApiResponse<Category>> => {
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

        const insertResult = await client.query(
          "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *",
          [payload.name, payload.description || null]
        );
        const newCategory = insertResult.rows[0];

        await client.query(
          "INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)",
          [callerUserId, "CATEGORY_ADD", `Added category: ${payload.name}`]
        );

        await client.query('COMMIT');

        return { success: true, data: { ...newCategory, product_count: 0 } };
      } catch (error) {
        await client.query('ROLLBACK');
        return { success: false, error: error instanceof Error ? error.message : "Failed to add category" };
      } finally {
        client.release();
      }
    }
  );

  ipcMain.handle(
    "categories:update",
    async (_, id: number, payload: AddCategoryPayload, callerUserId: number): Promise<ApiResponse<Category>> => {
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

        const updateResult = await client.query(
          "UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *",
          [payload.name, payload.description || null, id]
        );
        const updatedCategory = updateResult.rows[0];

        const productCountResult = await client.query(
          "SELECT COUNT(*) as product_count FROM products WHERE category_id = $1",
          [id]
        );
        const productCount = parseInt(productCountResult.rows[0].product_count, 10);

        await client.query(
          "INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)",
          [callerUserId, "CATEGORY_UPDATE", `Updated category: ${payload.name}`]
        );

        await client.query('COMMIT');

        return { success: true, data: { ...updatedCategory, product_count } };
      } catch (error) {
        await client.query('ROLLBACK');
        return { success: false, error: error instanceof Error ? error.message : "Failed to update category" };
      } finally {
        client.release();
      }
    }
  );

  ipcMain.handle(
    "categories:delete",
    async (_, id: number, callerUserId: number): Promise<ApiResponse> => {
      const pool = getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const callerResult = await client.query("SELECT role FROM users WHERE id = $1", [callerUserId]);
        const caller = callerResult.rows[0] as { role: UserRole } | undefined;
        
        if (!caller || !["super_admin", "admin"].includes(caller.role)) {
          await client.query('ROLLBACK');
          return { success: false, error: "Unauthorized" };
        }

        const productCountResult = await client.query(
          "SELECT COUNT(*) as product_count FROM products WHERE category_id = $1",
          [id]
        );
        const productCount = parseInt(productCountResult.rows[0].product_count, 10);

        if (productCount > 0) {
          await client.query('ROLLBACK');
          return { success: false, error: "Cannot delete category with products" };
        }

        await client.query("DELETE FROM categories WHERE id = $1", [id]);

        await client.query(
          "INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)",
          [callerUserId, "CATEGORY_DELETE", `Deleted category id: ${id}`]
        );

        await client.query('COMMIT');

        return { success: true };
      } catch (error) {
        await client.query('ROLLBACK');
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete category" };
      } finally {
        client.release();
      }
    }
  );
}
