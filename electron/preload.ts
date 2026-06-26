import { contextBridge, ipcRenderer } from "electron";
import type {
  LoginPayload,
  AddProductPayload,
  UpdateProductPayload,
  AddCategoryPayload,
  StockTransactionPayload,
  DateRangeFilter,
  AddUserPayload,
  UpdateUserPayload,
  ElectronAPI,
  DbConfig,
} from "../src/types";

const electronAPI: ElectronAPI = {
  auth: {
    login: (payload: LoginPayload) => ipcRenderer.invoke("auth:login", payload),
    logout: (userId: number) => ipcRenderer.invoke("auth:logout", userId),
  },
  products: {
    getAll: (page?: number, search?: string) => ipcRenderer.invoke("products:getAll", page, search),
    add: (payload: AddProductPayload, callerUserId: number) =>
      ipcRenderer.invoke("products:add", payload, callerUserId),
    update: (payload: UpdateProductPayload, callerUserId: number) =>
      ipcRenderer.invoke("products:update", payload, callerUserId),
    delete: (id: number, callerUserId: number) => ipcRenderer.invoke("products:delete", id, callerUserId),
  },
  categories: {
    getAll: () => ipcRenderer.invoke("categories:getAll"),
    add: (payload: AddCategoryPayload, callerUserId: number) =>
      ipcRenderer.invoke("categories:add", payload, callerUserId),
    update: (id: number, payload: AddCategoryPayload, callerUserId: number) =>
      ipcRenderer.invoke("categories:update", id, payload, callerUserId),
    delete: (id: number, callerUserId: number) => ipcRenderer.invoke("categories:delete", id, callerUserId),
  },
  stock: {
    addIn: (payload: StockTransactionPayload, callerUserId: number) =>
      ipcRenderer.invoke("stock:addIn", payload, callerUserId),
    addOut: (payload: StockTransactionPayload, callerUserId: number) =>
      ipcRenderer.invoke("stock:addOut", payload, callerUserId),
    adjust: (payload: StockTransactionPayload, callerUserId: number) =>
      ipcRenderer.invoke("stock:adjust", payload, callerUserId),
  },
  transactions: {
    getAll: (filter: DateRangeFilter) => ipcRenderer.invoke("transactions:getAll", filter),
    getToday: () => ipcRenderer.invoke("transactions:getToday"),
  },
  users: {
    getAll: (callerUserId: number) => ipcRenderer.invoke("users:getAll", callerUserId),
    add: (payload: AddUserPayload, callerUserId: number) =>
      ipcRenderer.invoke("users:add", payload, callerUserId),
    update: (payload: UpdateUserPayload, callerUserId: number) =>
      ipcRenderer.invoke("users:update", payload, callerUserId),
    delete: (id: number, callerUserId: number) => ipcRenderer.invoke("users:delete", id, callerUserId),
  },
  reports: {
    export: (data: Record<string, string>[], filename: string) =>
      ipcRenderer.invoke("reports:export", data, filename),
  },
  dashboard: {
    getStats: () => ipcRenderer.invoke("dashboard:getStats"),
    getLowStock: () => ipcRenderer.invoke("dashboard:getLowStock"),
    getRecentTransactions: () => ipcRenderer.invoke("dashboard:getRecentTransactions"),
  },
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    update: (settings: any, callerUserId: number) =>
      ipcRenderer.invoke("settings:update", settings, callerUserId),
    backupDatabase: (callerUserId: number) =>
      ipcRenderer.invoke("settings:backupDatabase", callerUserId),
    getDbConfig: (callerUserId: number) => ipcRenderer.invoke("settings:getDbConfig", callerUserId),
    saveDbConfig: (config: DbConfig, callerUserId: number) => ipcRenderer.invoke("settings:saveDbConfig", config, callerUserId),
    testConnection: (config?: DbConfig) => ipcRenderer.invoke("settings:testConnection", config),
  },
};

contextBridge.exposeInMainWorld("api", electronAPI);
