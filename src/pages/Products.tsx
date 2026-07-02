
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Table } from "../components/Table";
import { Pagination } from "../components/Pagination";
import { SearchInput } from "../components/SearchInput";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import { useToast } from "../context/ToastContext";
import type { Product, Category, AddProductPayload, UpdateProductPayload } from "../types";

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<AddProductPayload>>({
    name: "",
    sku: "",
    category_id: undefined,
    cost: 0,
    low_stock_threshold: 10,
    unit: "Piece",
  });
  const { session, hasRole } = useAuth();
  const { currentStore } = useStore();
  const { showToast } = useToast();

  useEffect(() => {
    if (currentStore) {
      loadProducts();
    }
    loadCategories();
  }, [currentPage, search, currentStore]);

  const loadProducts = async () => {
    if (!currentStore) return;
    try {
      setLoading(true);
      const res = await window.api.products.getAll(currentPage, search || undefined, currentStore.id);
      if (res.success && res.data) {
        setProducts(res.data.data);
        setTotalPages(Math.ceil(res.data.total / 20));
      }
    } catch (error) {
      showToast("error", "Failed to load products");
    } finally {
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
    if (!session || !currentStore) return;
    if (!formData.name || !formData.unit) {
      showToast("error", "Please fill in all required fields");
      return;
    }

    try {
      let res;
      if (editingProduct) {
        const payload: UpdateProductPayload = {
          id: editingProduct.id,
          name: formData.name!,
          sku: formData.sku || editingProduct.sku,
          category_id: formData.category_id,
          cost: formData.cost || 0,
          low_stock_threshold: formData.low_stock_threshold || 10,
          unit: formData.unit || "Piece",
          store_id: currentStore.id,
        };
        res = await window.api.products.update(payload, session.userId);
      } else {
        const payload: AddProductPayload = {
          name: formData.name!,
          sku: formData.sku,
          category_id: formData.category_id,
          cost: formData.cost || 0,
          low_stock_threshold: formData.low_stock_threshold || 10,
          unit: formData.unit || "Piece",
          store_id: currentStore.id,
        };
        res = await window.api.products.add(payload, session.userId);
      }

      if (res.success && res.data) {
        showToast("success", editingProduct ? "Product updated" : "Product added");
        setIsModalOpen(false);
        resetForm();
        
        // Update state immediately for better UX
        if (editingProduct) {
          // Update existing product in state
          setProducts(prev => prev.map(p => 
            p.id === res.data!.id ? { ...p, ...res.data } : p
          ));
        } else {
          // Add new product to state (at beginning)
          setProducts(prev => [res.data, ...prev]);
        }
        
        // Then reload to get fresh data from server
        loadProducts();
      } else {
        showToast("error", res.error || "Failed to save product");
      }
    } catch (error) {
      showToast("error", "Failed to save product");
    }
  };

  const handleDelete = async () => {
    if (!session || !confirmDelete) return;
    const res = await window.api.products.delete(confirmDelete.id, session.userId);
    if (res.success) {
      showToast("success", "Product deleted");
      
      // First remove from local state immediately for better UX
      setProducts(prev => prev.filter(p => p.id !== confirmDelete.id));
      setConfirmDelete(null);
      
      // Then reload to make sure we have fresh data
      loadProducts();
    } else {
      showToast("error", res.error || "Failed to delete product");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category_id: undefined,
      cost: 0,
      low_stock_threshold: 10,
      unit: "Piece",
    });
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category_id: product.category_id ?? undefined,
      cost: product.cost,
      low_stock_threshold: product.low_stock_threshold,
      unit: product.unit || "Piece",
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
    { key: "status", label: "Status", render: (p: Product) => p.status && <StatusBadge status={p.status} /> },
    {
      key: "actions",
      label: "Actions",
      render: (p: Product) => (
        hasRole(["super_admin", "admin", "manager"]) && (
          <div className="flex gap-2">
            <button
              onClick={() => openEditModal(p)}
              className="p-1 text-primary hover:bg-blue-100 rounded"
            >
              <Edit className="w-4 h-4" />
            </button>
            {hasRole(["super_admin", "admin"]) && (
              <button
                onClick={() => setConfirmDelete(p)}
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
        {hasRole(["super_admin", "admin", "manager"]) && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        )}
      </div>

      <div className="w-full">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search products..."
        />
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={products}
          keyProp="id"
          loading={loading}
          emptyMessage="No products found"
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add Product"}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SKU
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Leave empty to auto-generate"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={formData.category_id || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category_id: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Unit <span className="text-danger">*</span>
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="Piece">Piece</option>
              <option value="Pair">Pair</option>
              <option value="Set">Set</option>
              <option value="Pack">Pack</option>
              <option value="Dozen">Dozen</option>
              <option value="Bale">Bale</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cost <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.cost}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cost: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Low Stock Threshold
            </label>
            <input
              type="number"
              min="0"
              value={formData.low_stock_threshold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  low_stock_threshold: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let color = "";
  if (status === "in_stock") color = "bg-green-100 text-green-80";
  else if (status === "low_stock") color = "bg-yellow-100 text-yellow-80";
  else color = "bg-red-100 text-red-80";

  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{status.replace("_", " ")}</span>;
}

