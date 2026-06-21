import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Package, AlertTriangle, TrendingUp, Archive } from "lucide-react";
import { Table } from "../components/Table";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../context/ToastContext";
export function Dashboard() {
    const [stats, setStats] = useState(null);
    const [lowStock, setLowStock] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            setLoading(true);
            const [statsRes, lowStockRes, transactionsRes] = await Promise.all([
                window.api.dashboard.getStats(),
                window.api.dashboard.getLowStock(),
                window.api.dashboard.getRecentTransactions(),
            ]);
            if (statsRes.success && statsRes.data)
                setStats(statsRes.data);
            if (lowStockRes.success)
                setLowStock(lowStockRes.data || []);
            if (transactionsRes.success)
                setRecentTransactions(transactionsRes.data || []);
        }
        catch (error) {
            showToast("error", "Failed to load dashboard");
        }
        finally {
            setLoading(false);
        }
    };
    const StatCard = ({ title, value, icon: Icon, color = "primary", badge, }) => {
        const colorClasses = {
            primary: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
            success: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
            warning: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
            danger: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        };
        return (_jsx("div", { className: "bg-white dark:bg-surface-dark rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: title }), _jsxs("p", { className: "text-2xl font-bold mt-1 flex items-center gap-2 text-gray-900 dark:text-white", children: [value, badge && (_jsx("span", { className: "text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full", children: badge }))] })] }), _jsx("div", { className: `p-3 rounded-lg ${colorClasses[color]}`, children: _jsx(Icon, { className: "w-6 h-6" }) })] }) }));
    };
    const transactionColumns = [
        { key: "created_at", label: "Date", render: (t) => new Date(t.created_at).toLocaleString() },
        { key: "product_name", label: "Product" },
        { key: "type", label: "Type", render: (t) => _jsx(StatusBadge, { status: t.type }) },
        { key: "quantity", label: "Quantity" },
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
            render: (p) => (_jsx("span", { className: p.current_stock === 0 ? "text-red-600 font-medium" : "text-yellow-600 font-medium", children: p.current_stock === 0 ? "Critical" : "Warning" })),
        },
    ];
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Dashboard" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(StatCard, { title: "Total Products", value: stats?.totalProducts || 0, icon: Package, color: "primary" }), _jsx(StatCard, { title: "Total Stock", value: stats?.totalStockValue || 0, icon: Archive, color: "success" }), _jsx(StatCard, { title: "Low Stock", value: stats?.lowStockCount || 0, icon: AlertTriangle, color: "warning", badge: stats && stats.lowStockCount > 0 ? `${stats.lowStockCount}` : undefined }), _jsx(StatCard, { title: "Today's Transactions", value: stats?.todayTransactions || 0, icon: TrendingUp, color: "primary" })] }), _jsxs("div", { className: "bg-white dark:bg-surface-dark rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-gray-900 dark:text-white", children: "Recent Transactions" }), _jsx(Table, { columns: transactionColumns, data: recentTransactions, keyProp: "id", emptyMessage: "No recent transactions" })] }), lowStock.length > 0 && (_jsxs("div", { className: "bg-white dark:bg-surface-dark rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-gray-900 dark:text-white", children: "Low Stock Alerts" }), _jsx(Table, { columns: lowStockColumns, data: lowStock, keyProp: "id" })] }))] }));
}
