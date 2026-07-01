
export type UserRole = "super_admin" | "admin" | "manager" | "staff";

export type TransactionType = "stock_in" | "stock_out" | "adjustment";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface Store {
  id: number;
  name: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface UserWithHash extends User {
  password_hash: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  product_count?: number;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category_id: number | null;
  category_name?: string;
  cost: number;
  low_stock_threshold: number;
  current_stock?: number;
  status?: StockStatus;
  unit: string;
  store_id: number;
  created_at: string;
}

export interface Stock {
  product_id: number;
  store_id: number;
  quantity: number;
  last_updated: string;
}

export interface Transaction {
  id: number;
  product_id: number;
  product_name?: string;
  type: TransactionType;
  quantity: number;
  amount?: number | null;
  buying_price?: number | null;
  selling_price?: number | null;
  note: string | null;
  performed_by: number;
  performed_by_username?: string;
  store_id: number;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  username?: string;
  action: string;
  details: string | null;
  store_id: number;
  created_at: string;
}

export interface Settings {
  low_stock_threshold: number;
  company_name: string;
}

export interface AuthSession {
  id: number;
  userId: number;
  username: string;
  role: UserRole;
}

export interface DashboardStats {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  todayTransactions: number;
  totalRevenue?: number;
  totalCost?: number;
  netProfit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AddProductPayload {
  name: string;
  sku?: string;
  category_id?: number;
  cost: number;
  low_stock_threshold: number;
  unit: string;
  store_id: number;
}

export interface UpdateProductPayload extends AddProductPayload {
  id: number;
}

export interface AddCategoryPayload {
  name: string;
  description?: string;
}

export interface StockTransactionPayload {
  product_id: number;
  quantity: number;
  note?: string;
  amount?: number;
  buying_price?: number;
  selling_price?: number;
}

export interface AddUserPayload {
  username: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
  new_password?: string;
}

export interface TransactionFilter {
  start_date?: string;
  end_date?: string;
  product_id?: number;
  type?: TransactionType;
  user_id?: number;
}

export interface DateRangeFilter {
  start_date?: string;
  end_date?: string;
  product_id?: number;
  type?: TransactionType;
  user_id?: number;
}

export interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface TestConnectionResult {
  success: boolean;
}

export interface AddStorePayload {
  name: string;
}

export interface UpdateStorePayload {
  id: number;
  name: string;
}

export interface ProfitLossStats {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  transactions: Transaction[];
}

export interface ElectronAPI {
  auth: {
    login: (payload: LoginPayload) => Promise<ApiResponse<AuthSession>>;
    logout: (userId: number) => Promise<ApiResponse>;
  };
  products: {
    getAll: (page?: number, search?: string, storeId?: number) => Promise<ApiResponse<PaginatedResult<Product>>>;
    add: (payload: AddProductPayload, callerUserId: number) => Promise<ApiResponse<Product>>;
    update: (payload: UpdateProductPayload, callerUserId: number) => Promise<ApiResponse<Product>>;
    delete: (id: number, callerUserId: number) => Promise<ApiResponse>;
  };
  categories: {
    getAll: () => Promise<ApiResponse<Category[]>>;
    add: (payload: AddCategoryPayload, callerUserId: number) => Promise<ApiResponse<Category>>;
    update: (id: number, payload: AddCategoryPayload, callerUserId: number) => Promise<ApiResponse<Category>>;
    delete: (id: number, callerUserId: number) => Promise<ApiResponse>;
  };
  stores: {
    getAll: () => Promise<ApiResponse<Store[]>>;
    add: (payload: AddStorePayload, callerUserId: number) => Promise<ApiResponse<Store>>;
    update: (payload: UpdateStorePayload, callerUserId: number) => Promise<ApiResponse<Store>>;
    delete: (id: number, callerUserId: number) => Promise<ApiResponse>;
  };
  stock: {
    addIn: (payload: StockTransactionPayload, callerUserId: number, storeId: number) => Promise<ApiResponse<Transaction>>;
    addOut: (payload: StockTransactionPayload, callerUserId: number, storeId: number) => Promise<ApiResponse<Transaction>>;
    adjust: (payload: StockTransactionPayload, callerUserId: number, storeId: number) => Promise<ApiResponse<Transaction>>;
  };
  transactions: {
    getAll: (filter?: TransactionFilter, storeId?: number) => Promise<ApiResponse<Transaction[]>>;
    getToday: (storeId?: number) => Promise<ApiResponse<Transaction[]>>;
    delete: (id: number, callerUserId: number) => Promise<ApiResponse>;
  };
  users: {
    getAll: (callerUserId: number) => Promise<ApiResponse<User[]>>;
    add: (payload: AddUserPayload, callerUserId: number) => Promise<ApiResponse<User>>;
    update: (payload: UpdateUserPayload, callerUserId: number) => Promise<ApiResponse<User>>;
    delete: (id: number, callerUserId: number) => Promise<ApiResponse>;
  };
  reports: {
    export: (data: Record<string, string>[], filename: string) => Promise<ApiResponse>;
    getProfitLoss: (filter?: TransactionFilter, storeId?: number) => Promise<ApiResponse<ProfitLossStats>>;
  };
  dashboard: {
    getStats: (storeId?: number) => Promise<ApiResponse<DashboardStats>>;
    getLowStock: (storeId?: number) => Promise<ApiResponse<Product[]>>;
    getRecentTransactions: (storeId?: number) => Promise<ApiResponse<Transaction[]>>;
  };
  settings: {
    get: () => Promise<ApiResponse<Settings>>;
    update: (settings: Partial<Settings>, callerUserId: number) => Promise<ApiResponse>;
    backupDatabase: (callerUserId: number) => Promise<ApiResponse>;
    getDbConfig: (callerUserId: number) => Promise<ApiResponse<DbConfig>>;
    saveDbConfig: (config: DbConfig, callerUserId: number) => Promise<ApiResponse>;
    testConnection: (config?: DbConfig) => Promise<ApiResponse<TestConnectionResult>>;
  };
}
