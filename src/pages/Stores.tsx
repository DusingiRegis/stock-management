import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Table } from "../components/Table";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import { useToast } from "../context/ToastContext";
import type { Store, AddStorePayload, UpdateStorePayload } from "../types";

export function Stores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Store | null>(null);
  const [formData, setFormData] = useState<AddStorePayload>({
    name: "",
  });
  const { session, hasRole } = useAuth();
  const { refreshStores } = useStore();
  const { showToast } = useToast();

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const res = await window.api.stores.getAll();
      if (res.success) {
        setStores(res.data || []);
      }
    } catch (error) {
      showToast("error", "Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!session) return;
    if (!formData.name) {
      showToast("error", "Name is required");
      return;
    }

    try {
      let res;
      if (editingStore) {
        const payload: UpdateStorePayload = {
          id: editingStore.id,
          name: formData.name,
        };
        res = await window.api.stores.update(payload, session.userId);
      } else {
        res = await window.api.stores.add(formData, session.userId);
      }

      if (res.success) {
        showToast("success", editingStore ? "Store updated" : "Store added");
        setIsModalOpen(false);
        resetForm();
        loadStores();
        await refreshStores();
      } else {
        showToast("error", res.error || "Failed to save store");
      }
    } catch (error) {
      showToast("error", "Failed to save store");
    }
  };

  const handleDelete = async () => {
    if (!session || !confirmDelete) return;
    const res = await window.api.stores.delete(confirmDelete.id, session.userId);
    if (res.success) {
      showToast("success", "Store deleted");
      setConfirmDelete(null);
      loadStores();
      await refreshStores();
    } else {
      showToast("error", res.error || "Cannot delete the last store");
    }
  };

  const resetForm = () => {
    setFormData({ name: "" });
    setEditingStore(null);
  };

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "created_at",
      label: "Created",
      render: (s: Store) => new Date(s.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "Actions",
      render: (s: Store) => (
        hasRole(["super_admin", "admin"]) && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingStore(s);
                setFormData({ name: s.name });
                setIsModalOpen(true);
              }}
              className="p-1 text-primary hover:bg-blue-100 rounded"
            >
              <Edit className="w-4 h-4" />
            </button>
            {hasRole(["super_admin", "admin"]) && (
              <button
                onClick={() => setConfirmDelete(s)}
                className="p-1 text-danger hover:bg-red-100 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stores</h1>
        {hasRole(["super_admin", "admin"]) && (
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            Add Store
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={stores}
          keyProp="id"
          loading={loading}
          emptyMessage="No stores found"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStore ? "Edit Store" : "Add Store"}
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
              Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Store"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
