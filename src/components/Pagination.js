import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronLeft, ChevronRight } from "lucide-react";
export function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1)
        return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (_jsxs("div", { className: "flex items-center justify-center gap-2 mt-4", children: [_jsx("button", { onClick: () => onPageChange(currentPage - 1), disabled: currentPage === 1, className: "p-2 rounded-md border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed", children: _jsx(ChevronLeft, { className: "w-4 h-4" }) }), pages.map((page) => (_jsx("button", { onClick: () => onPageChange(page), className: `px-3 py-1 rounded-md ${page === currentPage
                    ? "bg-primary text-white"
                    : "border hover:bg-gray-100"}`, children: page }, page))), _jsx("button", { onClick: () => onPageChange(currentPage + 1), disabled: currentPage === totalPages, className: "p-2 rounded-md border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed", children: _jsx(ChevronRight, { className: "w-4 h-4" }) })] }));
}
