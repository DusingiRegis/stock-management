
import { ipcMain, dialog, app } from "electron";
import { getPool } from "../db/database";
import type { Settings, ApiResponse, UserRole } from "../../src/types";

export function registerSettingsHandlers(): void {
  ipcMain.handle("settings:get", async (): Promise<ApiResponse<Settings>> => {
    try {
      const pool = getPool();
      const result = await pool.query("SELECT key, value FROM settings");
      const settings: Partial<Settings> = {};
      result.rows.forEach(row => {
        if (row.key === "low_stock_threshold") {
          settings.low_stock_threshold = parseInt(row.value, 10);
        } else if (row.key === "company_name") {
          settings.company_name = row.value;
        }
      });

      return {
        success: true,
        data: {
          low_stock_threshold: settings.low_stock_threshold ?? 10,
          company_name: settings.company_name ?? "My Company",
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to get settings" };
    }
  });

  ipcMain.handle(
    "settings:update",
    async (_, newSettings: Partial<Settings>, callerUserId: number): Promise<ApiResponse> => {
      const pool = getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const callerResult = await client.query("SELECT role FROM users WHERE id = $1", [callerUserId]);
        const caller = callerResult.rows[0] as { role: UserRole } | undefined;
        
        if (!caller || caller.role !== "super_admin") {
          await client.query('ROLLBACK');
          return { success: false, error: "Unauthorized" };
        }

        if (newSettings.low_stock_threshold !== undefined) {
          await client.query(
            "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
            ["low_stock_threshold", newSettings.low_stock_threshold.toString()]
          );
        }
        if (newSettings.company_name) {
          await client.query(
            "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
            ["company_name", newSettings.company_name]
          );
        }

        await client.query(
          "INSERT INTO audit_log (user_id, action, details) VALUES ($1, $2, $3)",
          [callerUserId, "SETTINGS_UPDATE", "Updated settings"]
        );

        await client.query('COMMIT');

        return { success: true };
      } catch (error) {
        await client.query('ROLLBACK');
        return { success: false, error: error instanceof Error ? error.message : "Failed to update settings" };
      } finally {
        client.release();
      }
    }
  );

  ipcMain.handle(
    "settings:backupDatabase",
    async (_, callerUserId: number): Promise<ApiResponse> => {
      try {
        const pool = getPool();
        const callerResult = await pool.query("SELECT role FROM users WHERE id = $1", [callerUserId]);
        const caller = callerResult.rows[0] as { role: UserRole } | undefined;
        
        if (!caller || caller.role !== "super_admin") {
          return { success: false, error: "Unauthorized" };
        }

        // Note: For PostgreSQL, you would typically use pg_dump for backups
        // This is a simplified placeholder
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to backup database" };
      }
    }
  );
}
