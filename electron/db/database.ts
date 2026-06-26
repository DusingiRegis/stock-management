
import { Pool, PoolConfig } from "pg";
import { app } from "electron";
import path from "path";
import fs from "fs/promises";

const DEFAULT_CONFIG: PoolConfig = {
  host: "localhost",
  port: 5432,
  database: "inventory_db",
  user: "postgres",
  password: "admin123",
};

let pool: Pool | null = null;

export function getConfigPath(): string {
  return path.join(app.getPath("userData"), "db-config.json");
}

export async function loadDbConfig(): Promise<PoolConfig> {
  const configPath = getConfigPath();
  try {
    const data = await fs.readFile(configPath, "utf8");
    const loadedConfig = JSON.parse(data);
    return { ...DEFAULT_CONFIG, ...loadedConfig };
  } catch (error) {
    // If file doesn't exist or error, use defaults
    return DEFAULT_CONFIG;
  }
}

export async function saveDbConfig(config: PoolConfig): Promise<void> {
  const configPath = getConfigPath();
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

export async function resetPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function getPool(): Promise<Pool> {
  if (!pool) {
    const config = await loadDbConfig();
    pool = new Pool(config);
  }
  return pool;
}

export async function createPoolWithConfig(config: PoolConfig): Promise<Pool> {
  return new Pool(config);
}

export default getPool;
