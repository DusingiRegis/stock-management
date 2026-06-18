import React from "react";

interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyProp: keyof T;
  loading?: boolean;
  emptyMessage?: string;
}

export function Table<T>({ columns, data, keyProp, loading, emptyMessage = "No data available" }: TableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-neutral dark:text-gray-400">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-surface-dark divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, index) => (
            <tr
              key={String(row[keyProp])}
              className={`hover:bg-blue-50 dark:hover:bg-blue-900/20 ${index % 2 === 0 ? "bg-white dark:bg-surface-dark" : "bg-gray-50/50 dark:bg-gray-800/30"}`}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {col.render ? col.render(row) : (row[col.key as keyof T] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
