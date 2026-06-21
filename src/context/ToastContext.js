import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
const ToastContext = createContext(undefined);
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const showToast = (type, message) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    };
    return (_jsxs(ToastContext.Provider, { value: { showToast }, children: [children, _jsx("div", { className: "fixed top-4 right-4 z-50 flex flex-col gap-2", children: toasts.map((toast) => (_jsxs("div", { className: `px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[300px] ${toast.type === "success"
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : toast.type === "error"
                            ? "bg-red-100 text-red-800 border border-red-300"
                            : toast.type === "warning"
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                                : "bg-blue-100 text-blue-800 border border-blue-300"}`, children: [_jsx("span", { className: "font-medium", children: toast.message }), _jsx("button", { onClick: () => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), className: "ml-auto opacity-70 hover:opacity-100", children: "\u00D7" })] }, toast.id))) })] }));
}
export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
