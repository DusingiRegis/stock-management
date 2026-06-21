import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Download, Printer } from "lucide-react";
import { Table } from "../components/Table";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
export function Reports() {
    const [activeTab, setActiveTab] = useState("current-stock");
    const [currentStock, setCurrentStock] = useState([]);
    const [stockActivity, setStockActivity] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [filters, setFilters] = useState({});
    const { hasRole } = useAuth();
    useEffect(() => {
        loadCurrentStock();
        loadLowStock();
    }, []);
    useEffect(() => {
        if (activeTab === "stock-activity") {
            loadStockActivity();
        }
    }, [activeTab, filters]);
    const loadCurrentStock = async () => {
        const res = await window.api.products.getAll(1);
        if (res.success) {
            setCurrentStock(res.data?.data || []);
        }
    };
    const loadStockActivity = async () => {
        const res = await window.api.transactions.getAll(filters);
        if (res.success) {
            setStockActivity(res.data || []);
        }
    };
    const loadLowStock = async () => {
        const res = await window.api.dashboard.getLowStock();
        if (res.success) {
            setLowStock(res.data || []);
        }
    };
    const handleExport = (data, filename) => {
        const csvData = data.map((item) => {
            const row = {};
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
        { key: "status", label: "Status", render: (p) => p.status && _jsx(StatusBadge, { status: p.status }) },
    ];
    const stockActivityColumns = [
        { key: "created_at", label: "Date", render: (t) => new Date(t.created_at).toLocaleString() },
        { key: "product_name", label: "Product" },
        { key: "type", label: "Type", render: (t) => _jsx(StatusBadge, { status: t.type }) },
        { key: "quantity", label: "Quantity" },
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
            render: (p) => (_jsx("span", { className: "text-danger font-medium", children: (p.low_stock_threshold || 0) - (p.current_stock || 0) })),
        },
    ];
    const tabs = [
        { id: "current-stock", label: "Current Stock" },
        { id: "stock-activity", label: "Stock Activity" },
        { id: "low-stock", label: "Low Stock" },
        ...(hasRole(["super_admin", "admin"]) ? [{ id: "audit-log", label: "Audit Log" }] : []),
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Reports" }), _jsxs("div", { className: "flex gap-2 no-print", children: [_jsxs("button", { onClick: handlePrint, className: "flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200", children: [_jsx(Printer, { className: "w-4 h-4" }), "Print"] }), _jsxs("button", { onClick: () => {
                                    if (activeTab === "current-stock")
                                        handleExport(currentStock, "current-stock.csv");
                                    if (activeTab === "stock-activity")
                                        handleExport(stockActivity, "stock-activity.csv");
                                    if (activeTab === "low-stock")
                                        handleExport(lowStock, "low-stock.csv");
                                }, className: "flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600", children: [_jsx(Download, { className: "w-4 h-4" }), "Export"] })] })] }), _jsx("div", { className: "flex gap-2 border-b dark:border-gray-700 no-print overflow-x-auto pb-1", children: tabs.map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab.id), className: `px-4 py-2 border-b-2 -mb-px whitespace-nowrap ${activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`, children: tab.label }, tab.id))) }), activeTab === "stock-activity" && (_jsxs("div", { className: "bg-white dark:bg-surface-dark rounded-lg shadow p-4 no-print grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Start Date" }), _jsx("input", { type: "date", value: filters.start_date || "", onChange: (e) => setFilters({ ...filters, start_date: e.target.value || undefined }), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "End Date" }), _jsx("input", { type: "date", value: filters.end_date || "", onChange: (e) => setFilters({ ...filters, end_date: e.target.value || undefined }), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white" })] })] })), _jsxs("div", { className: "bg-white dark:bg-surface-dark rounded-lg shadow p-6", children: [activeTab === "current-stock" && (_jsx(Table, { columns: currentStockColumns, data: currentStock, keyProp: "id", emptyMessage: "No products in stock" })), activeTab === "stock-activity" && (_jsx(Table, { columns: stockActivityColumns, data: stockActivity, keyProp: "id", emptyMessage: "No stock activity" })), activeTab === "low-stock" && (_jsx(Table, { columns: lowStockColumns, data: lowStock, keyProp: "id", emptyMessage: "No low stock products" })), activeTab === "audit-log" && (_jsx("div", { className: "text-center py-12 text-gray-500 dark:text-gray-400", children: "Audit log coming soon" }))] })] }));
}
