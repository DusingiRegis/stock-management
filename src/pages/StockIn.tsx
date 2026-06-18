import { useEffect, useState } from "react";
import { Table } from "../components/Table";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { Product, Transaction, StockTransactionPayload } from "../types";

export function StockIn() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [note, setNote] = useState<string>("");
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      const payload: StockTransactionPayload = {
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
      } else {
        showToast("error", res.error || "Failed to add stock");
      }
    } catch (error) {
      showToast("error", "Failed to add stock");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "created_at", label: "Time", render: (t: Transaction) => new Date(t.created_at).toLocaleTimeString() },
    { key: "product_name", label: "Product" },
    { key: "quantity", label: "Quantity" },
    { key: "note", label: "Note" },
    { key: "performed_by_username", label: "Added By" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock In</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-surface-dark rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add Stock</h2>
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
                {products.map((p) => (
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
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
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
              disabled={loading}
              className="w-full bg-success text-white py-2 rounded-md hover:bg-green-600 flex items-center justify-center gap-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : "Add Stock"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Today's Stock In</h2>
          <Table
            columns={columns}
            data={transactions}
            keyProp="id"
            emptyMessage="No stock in transactions today"
          />
        </div>
      </div>
    </div>
  );
}
