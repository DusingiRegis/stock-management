
import type { StockStatus, UserRole, TransactionType } from "../types";

interface StatusBadgeProps {
  status: StockStatus | UserRole | TransactionType;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStyles = () => {
    switch (status) {
      case "in_stock":
        return "bg-green-100 text-green-800";
      case "low_stock":
        return "bg-yellow-100 text-yellow-800";
      case "out_of_stock":
        return "bg-red-100 text-red-800";
      case "super_admin":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "manager":
        return "bg-teal-100 text-teal-800";
      case "staff":
        return "bg-gray-100 text-gray-800";
      case "stock_in":
        return "bg-green-100 text-green-800";
      case "stock_out":
        return "bg-red-100 text-red-800";
      case "adjustment":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLabel = () => {
    switch (status) {
      case "in_stock":
        return "In Stock";
      case "low_stock":
        return "Low Stock";
      case "out_of_stock":
        return "Out of Stock";
      case "super_admin":
        return "Super Admin";
      case "admin":
        return "Admin";
      case "manager":
        return "Manager";
      case "staff":
        return "Staff";
      case "stock_in":
        return "Stock In";
      case "stock_out":
        return "Stock Out";
      case "adjustment":
        return "Adjustment";
      default:
        return status;
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStyles()}`}>
      {getLabel()}
    </span>
  );
}
