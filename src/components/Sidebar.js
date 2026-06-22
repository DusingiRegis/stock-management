import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, Tags, ArrowDownToLine, ArrowUpFromLine, FileText, Users, Settings, LogOut, Sun, Moon, X, } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import logoSrc from "../assets/android-chrome-512x512.png";
const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/products", label: "Products", icon: Package },
    { path: "/categories", label: "Categories", icon: Tags },
    { path: "/stock-in", label: "Stock In", icon: ArrowDownToLine },
    { path: "/stock-out", label: "Stock Out", icon: ArrowUpFromLine },
    { path: "/reports", label: "Reports", icon: FileText },
    { path: "/users", label: "Users", icon: Users, roles: ["super_admin", "admin"] },
    { path: "/settings", label: "Settings", icon: Settings, roles: ["super_admin"] },
];
export function Sidebar({ onCloseMobile }) {
    const location = useLocation();
    const { session, logout, hasRole } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const visibleMenuItems = menuItems.filter((item) => !item.roles || hasRole(item.roles));
    return (_jsxs("aside", { className: "w-56 bg-sidebar-light dark:bg-sidebar-dark h-full flex flex-col text-white overflow-y-auto", children: [_jsxs("div", { className: "px-3 py-3 border-b border-gray-700 flex items-center gap-3 flex-shrink-0", children: [_jsx("img", { src: logoSrc, alt: "Cyuzuzo Logo", className: "w-12 h-12 rounded-lg object-cover" }), _jsx("h1", { className: "text-base font-bold flex-1 truncate", children: "Cyuzuzo" }), _jsx("button", { onClick: toggleTheme, className: "p-2 rounded-md hover:bg-white/10 transition-colors", title: theme === "light" ? "Dark Mode" : "Light Mode", children: theme === "light" ? _jsx(Moon, { className: "w-4 h-4" }) : _jsx(Sun, { className: "w-4 h-4" }) }), onCloseMobile && (_jsx("button", { onClick: onCloseMobile, className: "p-2 rounded-md hover:bg-white/10 transition-colors md:hidden", children: _jsx(X, { className: "w-4 h-4" }) }))] }), _jsx("nav", { className: "flex-1 px-2 py-2 space-y-0.5", children: visibleMenuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (_jsxs(Link, { to: item.path, onClick: onCloseMobile, className: `flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-colors ${isActive
                            ? "bg-primary/20 border-l-4 border-primary"
                            : "hover:bg-white/10"}`, children: [_jsx(Icon, { className: "w-4.5 h-4.5" }), _jsx("span", { className: "text-sm", children: item.label })] }, item.path));
                }) }), _jsxs("div", { className: "px-3 py-2 border-t border-gray-700 flex-shrink-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1.5", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-primary flex items-center justify-center font-semibold text-xs", children: session?.username.charAt(0).toUpperCase() }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs font-medium truncate", children: session?.username }), _jsx("p", { className: "text-[10px] text-gray-400", children: session?.role })] })] }), _jsxs("button", { onClick: logout, className: "flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-white/10 transition-colors text-gray-300 text-sm", children: [_jsx(LogOut, { className: "w-4 h-4" }), _jsx("span", { children: "Logout" })] })] })] }));
}
