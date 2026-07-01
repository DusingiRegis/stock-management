
import { useEffect, useState } from "react";
import { Table } from "../components/Table";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import { useToast } from "../context/ToastContext";
import type { Product, Transaction, StockTransactionPayload } from "../types";

export function StockOut() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<Transaction | null>(null);
  const { session } = useAuth();
  const { currentStore } = useStore();
  const { showToast } = useToast();

  const selectedProductData = products.find((p) => p.id === parseInt(selectedProduct));
  const qty = parseInt(quantity);
  const isQtyValid = selectedProductData && qty > 0 && qty <= (selectedProductData.current_stock || 0);

  useEffect(() => {
    if (currentStore) {
      loadProducts();
      loadTransactions();
    }
  }, [currentStore]);

  const loadProducts = async () => {
    if (!currentStore) return;
    const res = await window.api.products.getAll(1, undefined, currentStore.id);
    if (res.success) {
      setProducts(res.data?.data || []);
    }
  };

  const loadTransactions = async () => {
    if (!currentStore) return;
    const res = await window.api.transactions.getToday(currentStore.id);
    if (res.success) {
      setTransactions((res.data || []).filter((t) => t.type === "stock_out"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !currentStore || !selectedProduct || !quantity) {
      showToast("error", "Please fill in all required fields");
      return;
    }

    if (!isQtyValid) {
      showToast("error", "Invalid quantity");
      return;
    }

    try {
      setLoading(true);
      const payload: StockTransactionPayload = {
        product_id: parseInt(selectedProduct),
        quantity: qty,
        amount: amount ? parseFloat(amount) : undefined,
        selling_price: sellingPrice ? parseFloat(sellingPrice) : undefined,
        note: note || undefined,
      };
      const res = await window.api.stock.addOut(payload, session.userId, currentStore.id);
      if (res.success) {
        const product = products.find((p) => p.id === parseInt(selectedProduct));
        const newStock = (product?.current_stock || 0) - qty;
        showToast("success", `Removed ${qty} ${product?.unit} from ${product?.name}. Remaining: ${newStock}`);
        if (newStock <= (product?.low_stock_threshold || 0)) {
          showToast("warning", `${product?.name} is now low on stock (${newStock} remaining)`);
        }
        setSelectedProduct("");
        setQuantity("");
        setAmount("");
        setSellingPrice("");
        setNote("");
        loadProducts();
        loadTransactions();
      } else {
        showToast("error", res.error || "Failed to remove stock");
      }
    } catch (error) {
      showToast("error", "Failed to remove stock");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!session || !confirmDelete) return;
    const res = await window.api.transactions.delete(confirmDelete.id, session.userId);
    if (res.success) {
      showToast("success", "Transaction deleted");
      setConfirmDelete(null);
      loadTransactions();
    } else {
      showToast("error", res.error || "Failed to delete transaction");
    }
  };

  const columns = [
    { key: "created_at", label: "Time", render: (t: Transaction) => new Date(t.created_at).toLocaleTimeString() },
    { key: "product_name", label: "Product" },
    { key: "quantity", label: "Quantity" },
    { key: "amount", label: "Amount" },
    { key: "selling_price", label: "Selling Price" },
    { key: "note", label: "Note" },
    { key: "performed_by_username", label: "Removed By" },
    {
      key: "actions",
      label: "Actions",
      render: (t: Transaction) => (
        <button
          onClick={() => setConfirmDelete(t)}
          className="p-1 text-danger hover:bg-red-100 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Out</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-surface-dark rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Remove Stock</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product <span className="text-danger">*</span>
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select product</option>
                {products.filter((p) => (p.current_stock || 0) > 0).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) - Current: {p.current_stock}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantity <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={selectedProductData?.current_stock}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              {selectedProductData && quantity && !isQtyValid && (
                <p className="text-sm text-danger mt-1">
                  Only {selectedProductData.current_stock} units available
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Selling Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={3}
                maxLength={200}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !isQtyValid}
              className="w-full bg-danger text-white py-2 rounded-md hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" /> : "Remove Stock"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Today's Stock Out</h2>
          <Table
            columns={columns}
            data={transactions}
            keyProp="id"
            emptyMessage="No stock out transactions today"
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </div>
  );
}
