import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Table } from "../components/Table";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
export function StockIn() {
    const [products, setProducts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [quantity, setQuantity] = useState("");
    const [note, setNote] = useState("");
    const { session } = useAuth();
    const { showToast } = useToast();
    useEffect(() => {
        loadProducts();
        loadTransactions();
    }, []);
    const loadProducts = async () => {
        const res = await window.api.products.getAll(1);
        if (res.success) {
            setProducts(res.data?.data || []);
        }
    };
    const loadTransactions = async () => {
        const res = await window.api.transactions.getToday();
        if (res.success) {
            setTransactions((res.data || []).filter((t) => t.type === "stock_in"));
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!session || !selectedProduct || !quantity) {
            showToast("error", "Please fill in all required fields");
            return;
        }
        const qty = parseInt(quantity);
        if (qty <= 0) {
            showToast("error", "Quantity must be greater than 0");
            return;
        }
        try {
            setLoading(true);
            const payload = {
                product_id: parseInt(selectedProduct),
                quantity: qty,
                note: note || undefined,
            };
            const res = await window.api.stock.addIn(payload, session.userId);
            if (res.success) {
                const product = products.find((p) => p.id === parseInt(selectedProduct));
                showToast("success", `Added ${qty} ${product?.unit} to ${product?.name}`);
                setSelectedProduct("");
                setQuantity("");
                setNote("");
                loadProducts();
                loadTransactions();
            }
            else {
                showToast("error", res.error || "Failed to add stock");
            }
        }
        catch (error) {
            showToast("error", "Failed to add stock");
        }
        finally {
            setLoading(false);
        }
    };
    const columns = [
        { key: "created_at", label: "Time", render: (t) => new Date(t.created_at).toLocaleTimeString() },
        { key: "product_name", label: "Product" },
        { key: "quantity", label: "Quantity" },
        { key: "note", label: "Note" },
        { key: "performed_by_username", label: "Added By" },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Stock In" }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-1 bg-white dark:bg-surface-dark rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-gray-900 dark:text-white", children: "Add Stock" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: ["Product ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsxs("select", { value: selectedProduct, onChange: (e) => setSelectedProduct(e.target.value), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white", children: [_jsx("option", { value: "", children: "Select product" }), products.map((p) => (_jsxs("option", { value: p.id, children: [p.name, " (", p.sku, ") - Current: ", p.current_stock] }, p.id)))] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: ["Quantity ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("input", { type: "number", min: "1", value: quantity, onChange: (e) => setQuantity(e.target.value), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Note" }), _jsx("textarea", { value: note, onChange: (e) => setNote(e.target.value), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white", rows: 3, maxLength: 200 })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-success text-white py-2 rounded-md hover:bg-green-600 flex items-center justify-center gap-2", children: loading ? _jsx(LoadingSpinner, { size: "sm" }) : "Add Stock" })] })] }), _jsxs("div", { className: "lg:col-span-2 bg-white dark:bg-surface-dark rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-gray-900 dark:text-white", children: "Today's Stock In" }), _jsx(Table, { columns: columns, data: transactions, keyProp: "id", emptyMessage: "No stock in transactions today" })] })] })] }));
}
