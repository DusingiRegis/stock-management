import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Modal } from "./Modal";
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isLoading = false, }) {
    return (_jsx(Modal, { isOpen: isOpen, onClose: onClose, title: title, footer: _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { onClick: onClose, disabled: isLoading, className: "px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200", children: cancelText }), _jsx("button", { onClick: onConfirm, disabled: isLoading, className: "px-4 py-2 bg-danger text-white rounded-md hover:bg-red-600", children: confirmText })] }), children: _jsx("p", { className: "text-gray-700 dark:text-gray-300", children: message }) }));
}
