
import { ipcMain } from "electron";
import { getPool } from "../db/database";
import bcrypt from "bcryptjs";
import type { LoginPayload, AuthSession, ApiResponse } from "../../src/types";

export function registerAuthHandlers(): void {
  ipcMain.handle("auth:login", async (_, payload: LoginPayload): Promise<ApiResponse<AuthSession>> => {
    try {
      const pool = getPool();
      const result = await pool.query("SELECT * FROM users WHERE username = $1", [payload.username]);
      
      if (result.rows.length === 0) {
        return { success: false, error: "Invalid credentials" };
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return { success: false, error: "Account is deactivated" };
      }

      const passwordValid = bcrypt.compareSync(payload.password, user.password_hash);
      if (!passwordValid) {
        return { success: false, error: "Invalid credentials" };
      }

      // Log audit
      await pool.query(
        "INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)",
        [user.id, "LOGIN", `User ${user.username} logged in`]
      );

      const session: AuthSession = {
        id: user.id,
        userId: user.id,
        username: user.username,
        role: user.role,
      };

      return { success: true, data: session };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Login failed" };
    }
  });

  ipcMain.handle("auth:logout", async (_, userId: number): Promise<ApiResponse> => {
    try {
      const pool = getPool();
      await pool.query(
        "INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)",
        [userId, "LOGOUT", `User logged out`]
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Logout failed" };
    }
  });
}
