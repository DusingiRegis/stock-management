
import { useEffect, useState } from "react";
import { Download, Printer, DollarSign } from "lucide-react";
import { Table } from "../components/Table";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import type { Product, Transaction, TransactionFilter, ProfitLossStats } from "../types";

type ReportTab = "current-stock" | "stock-activity" | "low-stock" | "profit-loss" | "audit-log";

export function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>("current-stock");
  const [currentStock, setCurrentStock] = useState<Product[]>([]);
  const [stockActivity, setStockActivity] = useState<Transaction[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [profitLoss, setProfitLoss] = useState<ProfitLossStats | null>(null);
  const [filters, setFilters] = useState<TransactionFilter>({});
  const { hasRole } = useAuth();
  const { currentStore } = useStore();

  useEffect(() => {
    if (currentStore) {
      loadCurrentStock();
      loadLowStock();
    }
  }, [currentStore]);

  useEffect(() => {
    if (activeTab === "stock-activity" && currentStore) {
      loadStockActivity();
    } else if (activeTab === "profit-loss" && currentStore) {
      loadProfitLoss();
    }
  }, [activeTab, filters, currentStore]);

  const loadCurrentStock = async () => {
    if (!currentStore) return;
    const res = await window.api.products.getAll(1, undefined, currentStore.id);
    if (res.success) {
      setCurrentStock(res.data?.data || []);
    }
  };

  const loadStockActivity = async () => {
    if (!currentStore) return;
    const res = await window.api.transactions.getAll(filters, currentStore.id);
    if (res.success) {
      setStockActivity(res.data || []);
    }
  };

  const loadLowStock = async () => {
    if (!currentStore) return;
    const res = await window.api.dashboard.getLowStock(currentStore.id);
    if (res.success) {
      setLowStock(res.data || []);
    }
  };

  const loadProfitLoss = async () => {
    if (!currentStore) return;
    const res = await window.api.reports.getProfitLoss(filters, currentStore.id);
    if (res.success && res.data) {
      setProfitLoss(res.data);
    }
  };

  const handleExport = (data: any[], filename: string) => {
    const csvData = data.map((item) => {
      const row: any = {};
      Object.entries(item).forEach(([key, value]) => {
        if (typeof value !== "object" || value === null) {
          row[key] = value;
        }
      });
      return row;
    });
    window.api.reports.export(csvData, filename);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentStockColumns = [
    { key: "sku", label: "SKU" },
    { key: "name", label: "Name" },
    { key: "category_name", label: "Category" },
    { key: "unit", label: "Unit" },
    { key: "current_stock", label: "Quantity" },
    { key: "status", label: "Status", render: (p: Product) => p.status && <StatusBadge status={p.status} /> },
  ];

  const stockActivityColumns = [
    { key: "created_at", label: "Date", render: (t: Transaction) => new Date(t.created_at).toLocaleString() },
    { key: "product_name", label: "Product" },
    { key: "type", label: "Type", render: (t: Transaction) => <StatusBadge status={t.type} /> },
    { key: "quantity", label: "Quantity" },
    { key: "amount", label: "Amount" },
    { key: "note", label: "Note" },
    { key: "performed_by_username", label: "User" },
  ];

  const lowStockColumns = [
    { key: "sku", label: "SKU" },
    { key: "name", label: "Name" },
    { key: "category_name", label: "Category" },
    { key: "current_stock", label: "Current Stock" },
    { key: "low_stock_threshold", label: "Threshold" },
    {
      key: "shortage",
      label: "Shortage",
      render: (p: Product) => (
        <span className="text-danger font-medium">
          {(p.low_stock_threshold || 0) - (p.current_stock || 0)}
        </span>
      ),
    },
  ];

  const tabs = [
    { id: "current-stock", label: "Current Stock" },
    { id: "stock-activity", label: "Stock Activity" },
    { id: "low-stock", label: "Low Stock" },
    { id: "profit-loss", label: "Profit & Loss" },
    ...(hasRole(["super_admin", "admin"]) ? [{ id: "audit-log", label: "Audit Log" }] : []),
  ];

  const isStockOrProfitTab = activeTab === "stock-activity" || activeTab === "profit-loss";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <div className="flex gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => {
              if (activeTab === "current-stock") handleExport(currentStock, "current-stock.csv");
              if (activeTab === "stock-activity") handleExport(stockActivity, "stock-activity.csv");
              if (activeTab === "low-stock") handleExport(lowStock, "low-stock.csv");
              if (activeTab === "profit-loss" && profitLoss) handleExport(profitLoss.transactions, "profit-loss.csv");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b dark:border-gray-700 no-print overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ReportTab)}
            className={`px-4 py-2 border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isStockOrProfitTab && (
        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4 no-print grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.start_date || ""}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value || undefined })}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={filters.end_date || ""}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value || undefined })}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-6">
        {activeTab === "current-stock" && (
          <Table
            columns={currentStockColumns}
            data={currentStock}
            keyProp="id"
            emptyMessage="No products in stock"
          />
        )}
        {activeTab === "stock-activity" && (
          <Table
            columns={stockActivityColumns}
            data={stockActivity}
            keyProp="id"
            emptyMessage="No stock activity"
          />
        )}
        {activeTab === "low-stock" && (
          <Table
            columns={lowStockColumns}
            data={lowStock}
            keyProp="id"
            emptyMessage="No low stock products"
          />
        )}
        {activeTab === "profit-loss" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-800 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      ${(profitLoss?.totalRevenue || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-800 rounded-lg">
                    <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Total Cost</p>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                      ${(profitLoss?.totalCost || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              <div className={`rounded-lg p-6 border ${
                (profitLoss?.netProfit || 0) >= 0
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    (profitLoss?.netProfit || 0) >= 0
                      ? "bg-green-100 dark:bg-green-800"
                      : "bg-red-100 dark:bg-red-800"
                  }`}>
                    <DollarSign className={`w-6 h-6 ${
                      (profitLoss?.netProfit || 0) >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`} />
                  </div>
                  <div>
                    <p className={`text-sm ${
                      (profitLoss?.netProfit || 0) >= 0
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    }`}>Net Profit/Loss</p>
                    <p className={`text-2xl font-bold ${
                      (profitLoss?.netProfit || 0) >= 0
                        ? "text-green-900 dark:text-green-100"
                        : "text-red-900 dark:text-red-100"
                    }`}>
                      ${(profitLoss?.netProfit || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transactions</h3>
            <Table
              columns={stockActivityColumns}
              data={profitLoss?.transactions || []}
              keyProp="id"
              emptyMessage="No transactions found"
            />
          </div>
        )}
        {activeTab === "audit-log" && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Audit log coming soon
          </div>
        )}
      </div>
    </div>
  );
}
