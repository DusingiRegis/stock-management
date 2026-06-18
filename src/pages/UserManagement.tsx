import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Table } from "../components/Table";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { User, AddUserPayload, UpdateUserPayload, UserRole } from "../types";

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<AddUserPayload & { confirmPassword: string, is_active: boolean }>>({
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
    if (!session) return;
    try {
      setLoading(true);
      const res = await window.api.users.getAll(session.userId);
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (error) {
      showToast("error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const allowedRoles = (): UserRole[] => {
    if (hasRole(["super_admin"])) {
      return ["super_admin", "admin", "manager", "staff"];
    }
    return ["manager", "staff"];
  };

  const handleSave = async () => {
    if (!session) return;
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
        const payload: UpdateUserPayload = {
          id: editingUser.id,
          username: formData.username!,
          role: formData.role as UserRole,
          is_active: editingUser.is_active,
          new_password: formData.password || undefined,
        };
        res = await window.api.users.update(payload, session.userId);
      } else {
        const payload: AddUserPayload = {
          username: formData.username!,
          password: formData.password!,
          role: formData.role as UserRole,
        };
        res = await window.api.users.add(payload, session.userId);
      }

      if (res.success) {
        showToast("success", editingUser ? "User updated" : "User added");
        setIsModalOpen(false);
        resetForm();
        loadUsers();
      } else {
        showToast("error", res.error || "Failed to save user");
      }
    } catch (error) {
      showToast("error", "Failed to save user");
    }
  };

  const handleDelete = async () => {
    if (!session || !confirmDelete) return;
    const res = await window.api.users.delete(confirmDelete.id, session.userId);
    if (res.success) {
      showToast("success", "User deleted");
      setConfirmDelete(null);
      loadUsers();
    } else {
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
    { key: "role", label: "Role", render: (u: User) => <StatusBadge status={u.role} /> },
    { key: "is_active", label: "Status", render: (u: User) => u.is_active ? "Active" : "Inactive" },
    { key: "created_at", label: "Created", render: (u: User) => new Date(u.created_at).toLocaleDateString() },
    {
      key: "actions",
      label: "Actions",
      render: (u: User) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingUser(u);
              setFormData({
                username: u.username,
                role: u.role,
                is_active: u.is_active,
                password: "",
                confirmPassword: "",
              });
              setIsModalOpen(true);
            }}
            className="p-1 text-primary hover:bg-blue-100 rounded"
          >
            <Edit className="w-4 h-4" />
          </button>
          {hasRole(["super_admin"]) && u.id !== session?.id && (
            <button
              onClick={() => setConfirmDelete(u)}
              className="p-1 text-danger hover:bg-red-100 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
        {hasRole(["super_admin", "admin"]) && (
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={users}
          keyProp="id"
          loading={loading}
          emptyMessage="No users found"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Edit User" : "Add User"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : "Save"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          {!editingUser && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </>
          )}
          {editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password (leave empty to keep current)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role <span className="text-danger">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {allowedRoles().map((role) => (
                <option key={role} value={role}>
                  {role.replace("_", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          {editingUser && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.is_active ?? editingUser.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${confirmDelete?.username}"?`}
      />
    </div>
  );
}
