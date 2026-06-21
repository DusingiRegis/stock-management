import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Table({ columns, data, keyProp, loading, emptyMessage = "No data available" }) {
    if (loading) {
        return (_jsx("div", { className: "flex justify-center items-center py-8", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }));
    }
    if (data.length === 0) {
        return (_jsx("div", { className: "flex flex-col items-center justify-center py-12 text-neutral dark:text-gray-400", children: _jsx("p", { children: emptyMessage }) }));
    }
    return (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 dark:bg-gray-800/50", children: _jsx("tr", { children: columns.map((col) => (_jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", style: { width: col.width }, children: col.label }, String(col.key)))) }) }), _jsx("tbody", { className: "bg-white dark:bg-surface-dark divide-y divide-gray-200 dark:divide-gray-700", children: data.map((row, index) => (_jsx("tr", { className: `hover:bg-blue-50 dark:hover:bg-blue-900/20 ${index % 2 === 0 ? "bg-white dark:bg-surface-dark" : "bg-gray-50/50 dark:bg-gray-800/30"}`, children: columns.map((col) => (_jsx("td", { className: "px-4 py-3 text-sm text-gray-900 dark:text-gray-100", children: col.render ? col.render(row) : row[col.key] }, String(col.key)))) }, String(row[keyProp])))) })] }) }));
}
