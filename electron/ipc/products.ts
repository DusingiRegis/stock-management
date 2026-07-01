
import { ipcMain } from "electron";
import { getPool } from "../db/database";
import type {
  Product,
  AddProductPayload,
  UpdateProductPayload,
  ApiResponse,
  PaginatedResult,
  UserRole,
} from "../../src/types";

export function registerProductHandlers(): void {
  ipcMain.handle(
    "products:getAll",
    async (_, page: number = 1, search?: string, storeId?: number): Promise<ApiResponse<PaginatedResult<Product>>> => {
      const pageSize = 20;
      const offset = (page - 1) * pageSize;

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
          WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (storeId) {
          query += ` AND p.store_id = $${paramIndex}`;
          params.push(storeId);
          paramIndex++;
        }

        if (search) {
          const searchTerm = `%${search.toLowerCase()}%`;
          query += ` AND (LOWER(p.name) LIKE $${paramIndex} OR LOWER(p.sku) LIKE $${paramIndex})`;
          params.push(searchTerm);
          paramIndex++;
        }

        query += ` ORDER BY p.created_at DESC`;

        // Get total count
        let countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*/, '');
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        // Get paginated data
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(pageSize, offset);
        const result = await pool.query(query, params);

        const processedProducts = result.rows.map(product => {
          let status: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
          if (product.current_stock === 0) status = "out_of_stock";
          else if (product.current_stock <= product.low_stock_threshold) status = "low_stock";
          return { ...product, status };
        });

        return {
          success: true,
          data: {
            data: processedProducts as Product[],
            total,
            page,
            pageSize,
          },
        };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to get products" };
      }
    }
  );

  ipcMain.handle(
    "products:add",
    async (_, payload: AddProductPayload, callerUserId: number): Promise<ApiResponse<Product>> => {
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

        const sku = payload.sku || `PRD-${Date.now()}`;

        const insertResult = await client.query(
          "INSERT INTO products (name, sku, category_id, cost, low_stock_threshold, unit, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
          [
            payload.name, 
            sku, 
            payload.category_id || null, 
            payload.cost, 
            payload.low_stock_threshold,
            payload.unit || 'Piece',
            payload.store_id
          ]
        );
        const newProduct = insertResult.rows[0];

        // Initialize stock for this store
        await client.query(
          "INSERT INTO stock (product_id, store_id, quantity) VALUES ($1, $2, $3)",
          [newProduct.id, payload.store_id, 0]
        );

        // Audit log
        await client.query(
          "INSERT INTO audit_log (user_id, action, details, store_id) VALUES ($1, $2, $3, $4)",
          [callerUserId, "PRODUCT_ADD", `Added product: ${payload.name}`, payload.store_id]
        );

        await client.query('COMMIT');

        return {
          success: true,
          data: {
            ...newProduct,
            category_name: null,
            current_stock: 0,
            status: "out_of_stock"
          } as Product
        };
      } catch (error) {
        await client.query('ROLLBACK');
        return { success: false, error: error instanceof Error ? error.message : "Failed to add product" };
      } finally {
        client.release();
      }
    }
  );

  ipcMain.handle(
    "products:update",
    async (_, payload: UpdateProductPayload, callerUserId: number): Promise<ApiResponse<Product>> => {
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

        const updateResult = await client.query(
          "UPDATE products SET name = $1, sku = $2, category_id = $3, cost = $4, low_stock_threshold = $5, unit = $6 WHERE id = $7 RETURNING *",
          [
            payload.name, 
            payload.sku, 
            payload.category_id || null, 
            payload.cost, 
            payload.low_stock_threshold,
            payload.unit || 'Piece',
            payload.id
          ]
        );
        const updatedProduct = updateResult.rows[0];

        await client.query(
          "INSERT INTO audit_log (user_id, action, details, store_id) VALUES ($1, $2, $3, $4)",
          [callerUserId, "PRODUCT_UPDATE", `Updated product: ${payload.name}`, payload.store_id]
        );

        await client.query('COMMIT');

        return { success: true, data: updatedProduct as Product };
      } catch (error) {
        await client.query('ROLLBACK');
        return { success: false, error: error instanceof Error ? error.message : "Failed to update product" };
      } finally {
        client.release();
      }
    }
  );

  ipcMain.handle(
    "products:delete",
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

        const productResult = await client.query("SELECT store_id, name FROM products WHERE id = $1", [id]);
        const product = productResult.rows[0];

        await client.query("DELETE FROM products WHERE id = $1", [id]);

        await client.query(
          "INSERT INTO audit_log (user_id, action, details, store_id) VALUES ($1, $2, $3, $4)",
          [callerUserId, "PRODUCT_DELETE", `Deleted product: ${product?.name}`, product?.store_id]
        );

        await client.query('COMMIT');

        return { success: true };
      } catch (error) {
        await client.query('ROLLBACK');
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete product" };
      } finally {
        client.release();
      }
    }
  );
}

