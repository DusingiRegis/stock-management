
import { ipcMain } from "electron";
import { getPool } from "../db/database";
import type { Store, AddStorePayload, UpdateStorePayload, ApiResponse, UserRole } from "../../src/types";

export function registerStoreHandlers(): void {
  ipcMain.handle("stores:getAll", async (): Promise<ApiResponse<Store[]>> => {
    try {
      const pool = await getPool();
      const result = await pool.query("SELECT * FROM stores ORDER BY name ASC");
      return { success: true, data: result.rows as Store[] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to get stores" };
    }
  });

  ipcMain.handle(
    "stores:add",
    async (_, payload: AddStorePayload, callerUserId: number): Promise<ApiResponse<Store>> => {
      const pool = await getPool();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const callerResult = await client.query("SELECT role FROM users WHERE id = $1", [callerUserId]);
        const caller = callerResult.rows[0] as { role: UserRole } | undefined;
        
        if (!caller || !["super_admin", "admin"].includes(caller.role)) {
          await client.query("ROLLBACK");
          return { success: false, error: "Unauthorized" };
        }

        const insertResult = await client.query(
          "INSERT INTO stores (name) VALUES ($1) RETURNING *",
          [payload.name]
        );
        const newStore = insertResult.rows[0];

        await client.query(
          "INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)",
          [callerUserId, "STORE_ADD", `Added store: ${payload.name}`]
        );

        await client.query("COMMIT");

        return { success: true, data: newStore as Store };
      } catch (error) {
        await client.query("ROLLBACK");
        return { success: false, error: error instanceof Error ? error.message : "Failed to add store" };
      } finally {
        client.release();
      }
    }
  );

  ipcMain.handle(
    "stores:update",
    async (_, payload: UpdateStorePayload, callerUserId: number): Promise<ApiResponse<Store>> => {
      const pool = await getPool();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const callerResult = await client.query("SELECT role FROM users WHERE id = $1", [callerUserId]);
        const caller = callerResult.rows[0] as { role: UserRole } | undefined;
        
        if (!caller || !["super_admin", "admin"].includes(caller.role)) {
          await client.query("ROLLBACK");
          return { success: false, error: "Unauthorized" };
        }

        const updateResult = await client.query(
          "UPDATE stores SET name = $1 WHERE id = $2 RETURNING *",
          [payload.name, payload.id]
        );
        const updatedStore = updateResult.rows[0];

        await client.query(
          "INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)",
          [callerUserId, "STORE_UPDATE", `Updated store: ${payload.name}`]
        );

        await client.query("COMMIT");

        return { success: true, data: updatedStore as Store };
      } catch (error) {
        await client.query("ROLLBACK");
        return { success: false, error: error instanceof Error ? error.message : "Failed to update store" };
      } finally {
        client.release();
      }
    }
  );

  ipcMain.handle(
    "stores:delete",
    async (_, id: number, callerUserId: number): Promise<ApiResponse> => {
      const pool = await getPool();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const callerResult = await client.query("SELECT role FROM users WHERE id = $1", [callerUserId]);
        const caller = callerResult.rows[0] as { role: UserRole } | undefined;
        
        if (!caller || !["super_admin", "admin"].includes(caller.role)) {
          await client.query("ROLLBACK");
          return { success: false, error: "Unauthorized" };
        }

        const storeCheck = await client.query("SELECT COUNT(*) as count FROM stores");
        if (parseInt(storeCheck.rows[0].count, 10) <= 1) {
          await client.query("ROLLBACK");
          return { success: false, error: "Cannot delete the last store" };
        }

        const storeResult = await client.query("SELECT name FROM stores WHERE id = $1", [id]);
        const storeName = storeResult.rows[0]?.name;

        await client.query("DELETE FROM stores WHERE id = $1", [id]);

        await client.query(
          "INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)",
          [callerUserId, "STORE_DELETE", `Deleted store: ${storeName}`]
        );

        await client.query("COMMIT");

        return { success: true };
      } catch (error) {
        await client.query("ROLLBACK");
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete store" };
      } finally {
        client.release();
      }
    }
  );
}
