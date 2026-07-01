
import { useEffect, useState } from "react";
import { Package, AlertTriangle, TrendingUp, Archive, DollarSign } from "lucide-react";
import { Table } from "../components/Table";
import { StatusBadge } from "../components/StatusBadge";
import type { DashboardStats, Product, Transaction } from "../types";
import { useToast } from "../context/ToastContext";
import { useStore } from "../context/StoreContext";

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { currentStore } = useStore();

  useEffect(() => {
    if (currentStore) {
      loadData();
    }
  }, [currentStore]);

  const loadData = async () => {
    if (!currentStore) return;
    try {
      setLoading(true);
      const [statsRes, lowStockRes, transactionsRes] = await Promise.all([
        window.api.dashboard.getStats(currentStore.id),
        window.api.dashboard.getLowStock(currentStore.id),
        window.api.dashboard.getRecentTransactions(currentStore.id),
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (lowStockRes.success) setLowStock(lowStockRes.data || []);
      if (transactionsRes.success) setRecentTransactions(transactionsRes.data || []);
    } catch (error) {
      showToast("error", "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = "primary",
    badge,
  }: {
    title: string;
    value: number | string;
    icon: any;
    color?: "primary" | "success" | "warning" | "danger";
    badge?: string;
  }) => {
    const colorClasses = {
      primary: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      success: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      warning: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
      danger: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    };

    return (
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold mt-1 flex items-center gap-2 text-gray-900 dark:text-white">
              {value}
              {badge && (
                <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full">
                  {badge}
                </span>
              )}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  const transactionColumns = [
    { key: "created_at", label: "Date", render: (t: Transaction) => new Date(t.created_at).toLocaleString() },
    { key: "product_name", label: "Product" },
    { key: "type", label: "Type", render: (t: Transaction) => <StatusBadge status={t.type} /> },
    { key: "quantity", label: "Quantity" },
    { key: "amount", label: "Amount" },
    { key: "note", label: "Note" },
    { key: "performed_by_username", label: "By" },
  ];

  const lowStockColumns = [
    { key: "name", label: "Product" },
    { key: "sku", label: "SKU" },
    { key: "category_name", label: "Category" },
    { key: "current_stock", label: "Current Stock" },
    { key: "low_stock_threshold", label: "Threshold" },
    {
      key: "status",
      label: "Urgency",
      render: (p: Product) => (
        <span className={p.current_stock === 0 ? "text-red-600 font-medium" : "text-yellow-600 font-medium"}>
          {p.current_stock === 0 ? "Critical" : "Warning"}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          icon={Package}
          color="primary"
        />
        <StatCard
          title="Total Stock"
          value={stats?.totalStockValue || 0}
          icon={Archive}
          color="success"
        />
        <StatCard
          title="Low Stock"
          value={stats?.lowStockCount || 0}
          icon={AlertTriangle}
          color="warning"
          badge={stats && stats.lowStockCount > 0 ? `${stats.lowStockCount}` : undefined}
        />
        <StatCard
          title="Today's Transactions"
          value={stats?.todayTransactions || 0}
          icon={TrendingUp}
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${(stats?.totalRevenue || 0).toFixed(2)}`}
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="Total Cost"
          value={`$${(stats?.totalCost || 0).toFixed(2)}`}
          icon={DollarSign}
          color="warning"
        />
        <StatCard
          title="Net Profit/Loss"
          value={`$${(stats?.netProfit || 0).toFixed(2)}`}
          icon={DollarSign}
          color={(stats?.netProfit || 0) >= 0 ? "success" : "danger"}
        />
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Transactions</h2>
        <Table
          columns={transactionColumns}
          data={recentTransactions}
          keyProp="id"
          emptyMessage="No recent transactions"
        />
      </div>

      {lowStock.length > 0 && (
        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Low Stock Alerts</h2>
          <Table
            columns={lowStockColumns}
            data={lowStock}
            keyProp="id"
          />
        </div>
      )}
    </div>
  );
}
