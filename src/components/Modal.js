import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from "lucide-react";
export function Modal({ isOpen, onClose, title, children, footer }) {
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [_jsx("div", { className: "absolute inset-0 bg-black/40", onClick: onClose }), _jsxs("div", { className: "relative bg-white dark:bg-surface-dark rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b dark:border-gray-700", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: title }), _jsx("button", { onClick: onClose, className: "p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700", children: _jsx(X, { className: "w-5 h-5 text-gray-600 dark:text-gray-300" }) })] }), _jsx("div", { className: "p-4", children: children }), footer && _jsx("div", { className: "p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30", children: footer })] })] }));
}
