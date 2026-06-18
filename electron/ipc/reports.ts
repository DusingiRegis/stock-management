import { ipcMain, dialog } from "electron";
import fs from "fs";
import path from "path";
import type { ApiResponse } from "../../src/types";

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
}
