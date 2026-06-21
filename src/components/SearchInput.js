import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Search } from "lucide-react";
export function SearchInput({ value, onChange, placeholder = "Search..." }) {
    return (_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx("input", { type: "text", value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, className: "pl-10 pr-4 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white" })] }));
}
