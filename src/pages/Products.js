import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Table } from "../components/Table";
import { Pagination } from "../components/Pagination";
import { SearchInput } from "../components/SearchInput";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
export function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        category_id: undefined,
        unit: "pcs",
        low_stock_threshold: 10,
    });
    const { session, hasRole } = useAuth();
    const { showToast } = useToast();
    useEffect(() => {
        loadProducts();
        loadCategories();
    }, [currentPage, search]);
    const loadProducts = async () => {
        try {
            setLoading(true);
            const res = await window.api.products.getAll(currentPage, search || undefined);
            if (res.success && res.data) {
                setProducts(res.data.data);
                setTotalPages(Math.ceil(res.data.total / 20));
            }
        }
        catch (error) {
            showToast("error", "Failed to load products");
        }
        finally {
            setLoading(false);
        }
    };
    const loadCategories = async () => {
        const res = await window.api.categories.getAll();
        if (res.success) {
            setCategories(res.data || []);
        }
    };
    const handleSave = async () => {
        if (!session)
            return;
        if (!formData.name || !formData.unit) {
            showToast("error", "Please fill in all required fields");
            return;
        }
        try {
            let res;
            if (editingProduct) {
                const payload = {
                    id: editingProduct.id,
                    name: formData.name,
                    sku: formData.sku || editingProduct.sku,
                    category_id: formData.category_id,
                    unit: formData.unit,
                    low_stock_threshold: formData.low_stock_threshold || 10,
                };
                res = await window.api.products.update(payload, session.userId);
            }
            else {
                const payload = {
                    name: formData.name,
                    sku: formData.sku,
                    category_id: formData.category_id,
                    unit: formData.unit,
                    low_stock_threshold: formData.low_stock_threshold || 10,
                };
                res = await window.api.products.add(payload, session.userId);
            }
            if (res.success) {
                showToast("success", editingProduct ? "Product updated" : "Product added");
                setIsModalOpen(false);
                resetForm();
                loadProducts();
            }
            else {
                showToast("error", res.error || "Failed to save product");
            }
        }
        catch (error) {
            showToast("error", "Failed to save product");
        }
    };
    const handleDelete = async () => {
        if (!session || !confirmDelete)
            return;
        const res = await window.api.products.delete(confirmDelete.id, session.userId);
        if (res.success) {
            showToast("success", "Product deleted");
            setConfirmDelete(null);
            loadProducts();
        }
        else {
            showToast("error", res.error || "Failed to delete product");
        }
    };
    const resetForm = () => {
        setFormData({
            name: "",
            sku: "",
            category_id: undefined,
            unit: "pcs",
            low_stock_threshold: 10,
        });
        setEditingProduct(null);
    };
    const openAddModal = () => {
        resetForm();
        setIsModalOpen(true);
    };
    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            sku: product.sku,
            category_id: product.category_id ?? undefined,
            unit: product.unit,
            low_stock_threshold: product.low_stock_threshold,
        });
        setIsModalOpen(true);
    };
    const columns = [
        { key: "sku", label: "SKU" },
        { key: "name", label: "Name" },
        { key: "category_name", label: "Category" },
        { key: "unit", label: "Unit" },
        { key: "current_stock", label: "Stock" },
        { key: "low_stock_threshold", label: "Threshold" },
        { key: "status", label: "Status", render: (p) => p.status && _jsx(StatusBadge, { status: p.status }) },
        {
            key: "actions",
            label: "Actions",
            render: (p) => (hasRole(["super_admin", "admin", "manager"]) && (_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => openEditModal(p), className: "p-1 text-primary hover:bg-blue-100 rounded", children: _jsx(Edit, { className: "w-4 h-4" }) }), hasRole(["super_admin", "admin"]) && (_jsx("button", { onClick: () => setConfirmDelete(p), className: "p-1 text-danger hover:bg-red-100 rounded", children: _jsx(Trash2, { className: "w-4 h-4" }) }))] }))),
        },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Products" }), hasRole(["super_admin", "admin", "manager"]) && (_jsxs("button", { onClick: openAddModal, className: "flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600", children: [_jsx(Plus, { className: "w-4 h-4" }), "Add Product"] }))] }), _jsx("div", { className: "w-full", children: _jsx(SearchInput, { value: search, onChange: setSearch, placeholder: "Search products..." }) }), _jsxs("div", { className: "bg-white dark:bg-surface-dark rounded-lg shadow overflow-hidden", children: [_jsx(Table, { columns: columns, data: products, keyProp: "id", loading: loading, emptyMessage: "No products found" }), _jsx(Pagination, { currentPage: currentPage, totalPages: totalPages, onPageChange: setCurrentPage })] }), _jsx(Modal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), title: editingProduct ? "Edit Product" : "Add Product", footer: _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { onClick: () => setIsModalOpen(false), className: "px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200", children: "Cancel" }), _jsx("button", { onClick: handleSave, className: "px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 flex items-center gap-2", children: loading ? _jsx(LoadingSpinner, { size: "sm" }) : "Save" })] }), children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: ["Name ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "SKU" }), _jsx("input", { type: "text", value: formData.sku, onChange: (e) => setFormData({ ...formData, sku: e.target.value }), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white", placeholder: "Leave empty to auto-generate" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Category" }), _jsxs("select", { value: formData.category_id || "", onChange: (e) => setFormData({
                                        ...formData,
                                        category_id: e.target.value ? parseInt(e.target.value) : undefined,
                                    }), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white", children: [_jsx("option", { value: "", children: "Select category" }), categories.map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id)))] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: ["Unit ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsxs("select", { value: formData.unit, onChange: (e) => setFormData({ ...formData, unit: e.target.value }), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white", children: [_jsx("option", { value: "pcs", children: "pcs" }), _jsx("option", { value: "kg", children: "kg" }), _jsx("option", { value: "liters", children: "liters" }), _jsx("option", { value: "boxes", children: "boxes" }), _jsx("option", { value: "bags", children: "bags" }), _jsx("option", { value: "cartons", children: "cartons" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Low Stock Threshold" }), _jsx("input", { type: "number", min: "0", value: formData.low_stock_threshold, onChange: (e) => setFormData({
                                        ...formData,
                                        low_stock_threshold: parseInt(e.target.value) || 0,
                                    }), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white" })] })] }) }), _jsx(ConfirmDialog, { isOpen: !!confirmDelete, onClose: () => setConfirmDelete(null), onConfirm: handleDelete, title: "Delete Product", message: `Are you sure you want to delete "${confirmDelete?.name}"?` })] }));
}
