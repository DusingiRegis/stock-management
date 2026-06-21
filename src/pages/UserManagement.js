import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Table } from "../components/Table";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
export function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        role: "staff",
        is_active: true,
    });
    const { session, hasRole } = useAuth();
    const { showToast } = useToast();
    useEffect(() => {
        loadUsers();
    }, []);
    const loadUsers = async () => {
        if (!session)
            return;
        try {
            setLoading(true);
            const res = await window.api.users.getAll(session.userId);
            if (res.success) {
                setUsers(res.data || []);
            }
        }
        catch (error) {
            showToast("error", "Failed to load users");
        }
        finally {
            setLoading(false);
        }
    };
    const allowedRoles = () => {
        if (hasRole(["super_admin"])) {
            return ["super_admin", "admin", "manager", "staff"];
        }
        return ["manager", "staff"];
    };
    const handleSave = async () => {
        if (!session)
            return;
        if (!formData.username || (!editingUser && !formData.password)) {
            showToast("error", "Please fill in all required fields");
            return;
        }
        if (!editingUser && formData.password !== formData.confirmPassword) {
            showToast("error", "Passwords do not match");
            return;
        }
        if (!editingUser && (formData.password?.length || 0) < 8) {
            showToast("error", "Password must be at least 8 characters");
            return;
        }
        try {
            let res;
            if (editingUser) {
                const payload = {
                    id: editingUser.id,
                    username: formData.username,
                    role: formData.role,
                    is_active: editingUser.is_active,
                    new_password: formData.password || undefined,
                };
                res = await window.api.users.update(payload, session.userId);
            }
            else {
                const payload = {
                    username: formData.username,
                    password: formData.password,
                    role: formData.role,
                };
                res = await window.api.users.add(payload, session.userId);
            }
            if (res.success) {
                showToast("success", editingUser ? "User updated" : "User added");
                setIsModalOpen(false);
                resetForm();
                loadUsers();
            }
            else {
                showToast("error", res.error || "Failed to save user");
            }
        }
        catch (error) {
            showToast("error", "Failed to save user");
        }
    };
    const handleDelete = async () => {
        if (!session || !confirmDelete)
            return;
        const res = await window.api.users.delete(confirmDelete.id, session.userId);
        if (res.success) {
            showToast("success", "User deleted");
            setConfirmDelete(null);
            loadUsers();
        }
        else {
            showToast("error", res.error || "Failed to delete user");
        }
    };
    const resetForm = () => {
        setFormData({
            username: "",
            password: "",
            confirmPassword: "",
            role: "staff",
            is_active: true,
        });
        setEditingUser(null);
    };
    const columns = [
        { key: "username", label: "Username" },
        { key: "role", label: "Role", render: (u) => _jsx(StatusBadge, { status: u.role }) },
        { key: "is_active", label: "Status", render: (u) => u.is_active ? "Active" : "Inactive" },
        { key: "created_at", label: "Created", render: (u) => new Date(u.created_at).toLocaleDateString() },
        {
            key: "actions",
            label: "Actions",
            render: (u) => (_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => {
                            setEditingUser(u);
                            setFormData({
                                username: u.username,
                                role: u.role,
                                is_active: u.is_active,
                                password: "",
                                confirmPassword: "",
                            });
                            setIsModalOpen(true);
                        }, className: "p-1 text-primary hover:bg-blue-100 rounded", children: _jsx(Edit, { className: "w-4 h-4" }) }), hasRole(["super_admin"]) && u.id !== session?.id && (_jsx("button", { onClick: () => setConfirmDelete(u), className: "p-1 text-danger hover:bg-red-100 rounded", children: _jsx(Trash2, { className: "w-4 h-4" }) }))] })),
        },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Users" }), hasRole(["super_admin", "admin"]) && (_jsxs("button", { onClick: () => {
                            resetForm();
                            setIsModalOpen(true);
                        }, className: "flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600", children: [_jsx(Plus, { className: "w-4 h-4" }), "Add User"] }))] }), _jsx("div", { className: "bg-white dark:bg-surface-dark rounded-lg shadow overflow-hidden", children: _jsx(Table, { columns: columns, data: users, keyProp: "id", loading: loading, emptyMessage: "No users found" }) }), _jsx(Modal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), title: editingUser ? "Edit User" : "Add User", footer: _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { onClick: () => setIsModalOpen(false), className: "px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200", children: "Cancel" }), _jsx("button", { onClick: handleSave, className: "px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 flex items-center gap-2", children: loading ? _jsx(LoadingSpinner, { size: "sm" }) : "Save" })] }), children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: ["Username ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("input", { type: "text", value: formData.username, onChange: (e) => setFormData({ ...formData, username: e.target.value }), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white" })] }), !editingUser && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: ["Password ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("input", { type: "password", value: formData.password, onChange: (e) => setFormData({ ...formData, password: e.target.value }), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: ["Confirm Password ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("input", { type: "password", value: formData.confirmPassword, onChange: (e) => setFormData({ ...formData, confirmPassword: e.target.value }), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white" })] })] })), editingUser && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "New Password (leave empty to keep current)" }), _jsx("input", { type: "password", value: formData.password, onChange: (e) => setFormData({ ...formData, password: e.target.value }), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white" })] })), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: ["Role ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("select", { value: formData.role, onChange: (e) => setFormData({ ...formData, role: e.target.value }), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white", children: allowedRoles().map((role) => (_jsx("option", { value: role, children: role.replace("_", " ").toUpperCase() }, role))) })] }), editingUser && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", id: "isActive", checked: formData.is_active ?? editingUser.is_active, onChange: (e) => setFormData({ ...formData, is_active: e.target.checked }) }), _jsx("label", { htmlFor: "isActive", className: "text-sm text-gray-700 dark:text-gray-300", children: "Active" })] }))] }) }), _jsx(ConfirmDialog, { isOpen: !!confirmDelete, onClose: () => setConfirmDelete(null), onConfirm: handleDelete, title: "Delete User", message: `Are you sure you want to delete "${confirmDelete?.username}"?` })] }));
}
