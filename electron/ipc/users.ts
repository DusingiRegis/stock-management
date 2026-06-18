
import { ipcMain } from "electron";
import { getPool } from "../db/database";
import type { User, AddUserPayload, UpdateUserPayload, ApiResponse, UserRole } from "../../src/types";
import bcrypt from "bcryptjs";

export function registerUserHandlers(): void {
  ipcMain.handle(
    "users:getAll",
    async (_, callerUserId: number): Promise<ApiResponse<User[]>> => {
      try {
        const pool = getPool();
        const callerResult = await pool.query("SELECT role FROM users WHERE id = $1", [callerUserId]);
        const caller = callerResult.rows[0] as { role: UserRole } | undefined;
        
        if (!caller || !["super_admin", "admin"].includes(caller.role)) {
          return { success: false, error: "Unauthorized" };
        }

        const result = await pool.query("SELECT * FROM users ORDER BY created_at DESC");

        return { success: true, data: result.rows as User[] };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to get users" };
      }
    }
  );

  ipcMain.handle(
    "users:add",
    async (_, payload: AddUserPayload, callerUserId: number): Promise<ApiResponse<User>> => {
      const pool = getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const callerResult = await client.query("SELECT role FROM users WHERE id = $1", [callerUserId]);
        const caller = callerResult.rows[0] as { role: UserRole } | undefined;
        
        if (!caller) {
          await client.query('ROLLBACK');
          return { success: false, error: "Unauthorized" };
        }

        const allowedRoles = caller.role === "super_admin" 
          ? ["super_admin", "admin", "manager", "staff"]
          : ["manager", "staff"];

        if (!allowedRoles.includes(payload.role)) {
          await client.query('ROLLBACK');
          return { success: false, error: "Unauthorized role" };
        }

        const passwordHash = bcrypt.hashSync(payload.password, 10);
        const insertResult = await client.query(
          "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING *",
          [payload.username, passwordHash, payload.role]
        );
        const newUser = insertResult.rows[0];

        await client.query(
          "INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)",
          [callerUserId, "USER_ADD", `Added user: ${payload.username}`]
        );

        await client.query('COMMIT');

        return { success: true, data: newUser as User };
      } catch (error) {
        await client.query('ROLLBACK');
        return { success: false, error: error instanceof Error ? error.message : "Failed to add user" };
      } finally {
        client.release();
      }
    }
  );

  ipcMain.handle(
    "users:update",
    async (_, payload: UpdateUserPayload, callerUserId: number): Promise<ApiResponse<User>> => {
      const pool = getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const callerResult = await client.query("SELECT role FROM users WHERE id = $1", [callerUserId]);
        const caller = callerResult.rows[0] as { role: UserRole } | undefined;
        
        if (!caller) {
          await client.query('ROLLBACK');
          return { success: false, error: "Unauthorized" };
        }

        const targetUserResult = await client.query("SELECT * FROM users WHERE id = $1", [payload.id]);
        const targetUser = targetUserResult.rows[0] as User | undefined;
        
        if (!targetUser) {
          await client.query('ROLLBACK');
          return { success: false, error: "User not found" };
        }

        const allowedRoles = caller.role === "super_admin" 
          ? ["super_admin", "admin", "manager", "staff"]
          : ["manager", "staff"];

        if (caller.role !== "super_admin" && targetUser.role === "super_admin") {
          await client.query('ROLLBACK');
          return { success: false, error: "Cannot edit super admin" };
        }

        if (!allowedRoles.includes(payload.role)) {
          await client.query('ROLLBACK');
          return { success: false, error: "Unauthorized role" };
        }

        let query = "UPDATE users SET username = $1, role = $2, is_active = $3";
        const params: any[] = [payload.username, payload.role, payload.is_active];
        let paramIndex = 4;

        if (payload.new_password) {
          query += `, password_hash = $${paramIndex}`;
          params.push(bcrypt.hashSync(payload.new_password, 10));
          paramIndex++;
        }

        query += ` WHERE id = $${paramIndex}`;
        params.push(payload.id);

        await client.query(query, params);

        const updatedUserResult = await client.query("SELECT * FROM users WHERE id = $1", [payload.id]);
        const updatedUser = updatedUserResult.rows[0];

        await client.query(
          "INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)",
          [callerUserId, "USER_UPDATE", `Updated user: ${payload.username}`]
        );

        await client.query('COMMIT');

        return { success: true, data: updatedUser as User };
      } catch (error) {
        await client.query('ROLLBACK');
        return { success: false, error: error instanceof Error ? error.message : "Failed to update user" };
      } finally {
        client.release();
      }
    }
  );

  ipcMain.handle(
    "users:delete",
    async (_, id: number, callerUserId: number): Promise<ApiResponse> => {
      const pool = getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const callerResult = await client.query("SELECT role FROM users WHERE id = $1", [callerUserId]);
        const caller = callerResult.rows[0] as { role: UserRole } | undefined;
        
        if (!caller) {
          await client.query('ROLLBACK');
          return { success: false, error: "Unauthorized" };
        }

        if (id === callerUserId) {
          await client.query('ROLLBACK');
          return { success: false, error: "Cannot delete your own account" };
        }

        const targetUserResult = await client.query("SELECT * FROM users WHERE id = $1", [id]);
        const targetUser = targetUserResult.rows[0] as User | undefined;
        
        if (!targetUser) {
          await client.query('ROLLBACK');
          return { success: false, error: "User not found" };
        }

        if (caller.role !== "super_admin" && targetUser.role === "super_admin") {
          await client.query('ROLLBACK');
          return { success: false, error: "Cannot delete super admin" };
        }

        await client.query("DELETE FROM users WHERE id = $1", [id]);

        await client.query(
          "INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)",
          [callerUserId, "USER_DELETE", `Deleted user id: ${id}`]
        );

        await client.query('COMMIT');

        return { success: true };
      } catch (error) {
        await client.query('ROLLBACK');
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete user" };
      } finally {
        client.release();
      }
    }
  );
}
