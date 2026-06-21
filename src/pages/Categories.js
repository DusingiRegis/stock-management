import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Table } from "../components/Table";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
export function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
    });
    const { session, hasRole } = useAuth();
    const { showToast } = useToast();
    useEffect(() => {
        loadCategories();
    }, []);
    const loadCategories = async () => {
        try {
            setLoading(true);
            const res = await window.api.categories.getAll();
            if (res.success) {
                setCategories(res.data || []);
            }
        }
        catch (error) {
            showToast("error", "Failed to load categories");
        }
        finally {
            setLoading(false);
        }
    };
    const handleSave = async () => {
        if (!session)
            return;
        if (!formData.name) {
            showToast("error", "Name is required");
            return;
        }
        try {
            let res;
            if (editingCategory) {
                res = await window.api.categories.update(editingCategory.id, formData, session.userId);
            }
            else {
                res = await window.api.categories.add(formData, session.userId);
            }
            if (res.success) {
                showToast("success", editingCategory ? "Category updated" : "Category added");
                setIsModalOpen(false);
                resetForm();
                loadCategories();
            }
            else {
                showToast("error", res.error || "Failed to save category");
            }
        }
        catch (error) {
            showToast("error", "Failed to save category");
        }
    };
    const handleDelete = async () => {
        if (!session || !confirmDelete)
            return;
        const res = await window.api.categories.delete(confirmDelete.id, session.userId);
        if (res.success) {
            showToast("success", "Category deleted");
            setConfirmDelete(null);
            loadCategories();
        }
        else {
            showToast("error", res.error || "Cannot delete category with products");
        }
    };
    const resetForm = () => {
        setFormData({ name: "", description: "" });
        setEditingCategory(null);
    };
    const columns = [
        { key: "name", label: "Name" },
        { key: "description", label: "Description" },
        { key: "product_count", label: "Products" },
        { key: "created_at", label: "Created", render: (c) => new Date(c.created_at).toLocaleDateString() },
        {
            key: "actions",
            label: "Actions",
            render: (c) => (hasRole(["super_admin", "admin", "manager"]) && (_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => {
                            setEditingCategory(c);
                            setFormData({ name: c.name, description: c.description || "" });
                            setIsModalOpen(true);
                        }, className: "p-1 text-primary hover:bg-blue-100 rounded", children: _jsx(Edit, { className: "w-4 h-4" }) }), hasRole(["super_admin", "admin"]) && (_jsx("button", { onClick: () => setConfirmDelete(c), className: "p-1 text-danger hover:bg-red-100 rounded", children: _jsx(Trash2, { className: "w-4 h-4" }) }))] }))),
        },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Categories" }), hasRole(["super_admin", "admin", "manager"]) && (_jsxs("button", { onClick: () => {
                            resetForm();
                            setIsModalOpen(true);
                        }, className: "flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600", children: [_jsx(Plus, { className: "w-4 h-4" }), "Add Category"] }))] }), _jsx("div", { className: "bg-white dark:bg-surface-dark rounded-lg shadow overflow-hidden", children: _jsx(Table, { columns: columns, data: categories, keyProp: "id", loading: loading, emptyMessage: "No categories found" }) }), _jsx(Modal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), title: editingCategory ? "Edit Category" : "Add Category", footer: _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { onClick: () => setIsModalOpen(false), className: "px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200", children: "Cancel" }), _jsx("button", { onClick: handleSave, className: "px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 flex items-center gap-2", children: loading ? _jsx(LoadingSpinner, { size: "sm" }) : "Save" })] }), children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: ["Name ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white", rows: 3 })] })] }) }), _jsx(ConfirmDialog, { isOpen: !!confirmDelete, onClose: () => setConfirmDelete(null), onConfirm: handleDelete, title: "Delete Category", message: `Are you sure you want to delete "${confirmDelete?.name}"?` })] }));
}
