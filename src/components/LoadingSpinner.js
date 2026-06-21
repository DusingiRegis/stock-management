import { jsx as _jsx } from "react/jsx-runtime";
export function LoadingSpinner({ size = "md" }) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12",
    };
    return (_jsx("div", { className: `animate-spin rounded-full border-2 border-gray-200 border-t-primary ${sizeClasses[size]}` }));
}
