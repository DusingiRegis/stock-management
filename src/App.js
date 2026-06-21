import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Sidebar } from "./components/Sidebar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Products } from "./pages/Products";
import { Categories } from "./pages/Categories";
import { StockIn } from "./pages/StockIn";
import { StockOut } from "./pages/StockOut";
import { Reports } from "./pages/Reports";
import { UserManagement } from "./pages/UserManagement";
import { Settings } from "./pages/Settings";
import { useState } from "react";
import { Menu } from "lucide-react";
import "./index.css";
function AppContent() {
    const { session } = useAuth();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    if (!session) {
        return _jsx(Login, {});
    }
    return (_jsxs("div", { className: "flex h-full w-full", children: [isMobileSidebarOpen && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-40 md:hidden", onClick: () => setIsMobileSidebarOpen(false) })), _jsx("div", { className: `fixed md:static inset-y-0 left-0 z-50 transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out`, children: _jsx(Sidebar, { onCloseMobile: () => setIsMobileSidebarOpen(false) }) }), _jsxs("main", { className: "flex-1 overflow-auto bg-bg-light dark:bg-bg-dark", children: [_jsxs("div", { className: "md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-bg-light dark:bg-bg-dark sticky top-0 z-30", children: [_jsx("button", { onClick: () => setIsMobileSidebarOpen(true), className: "p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200", children: _jsx(Menu, { className: "w-6 h-6" }) }), _jsx("h1", { className: "text-lg font-bold text-gray-900 dark:text-white", children: "Stock Font" }), _jsx("div", { className: "w-10" }), " "] }), _jsx("div", { className: "p-4 md:p-6", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "/dashboard", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/products", element: _jsx(Products, {}) }), _jsx(Route, { path: "/categories", element: _jsx(Categories, {}) }), _jsx(Route, { path: "/stock-in", element: _jsx(StockIn, {}) }), _jsx(Route, { path: "/stock-out", element: _jsx(StockOut, {}) }), _jsx(Route, { path: "/reports", element: _jsx(Reports, {}) }), _jsx(Route, { path: "/users", element: _jsx(ProtectedRoute, { roles: ["super_admin", "admin"], children: _jsx(UserManagement, {}) }) }), _jsx(Route, { path: "/settings", element: _jsx(ProtectedRoute, { roles: ["super_admin"], children: _jsx(Settings, {}) }) })] }) })] })] }));
}
function App() {
    return (_jsx(ThemeProvider, { children: _jsx(AuthProvider, { children: _jsx(ToastProvider, { children: _jsx(Router, { children: _jsx(AppContent, {}) }) }) }) }));
}
export default App;
