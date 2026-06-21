
import { Link, useLocation } from "react-router-dom";
import type React from "react";
import {
  LayoutDashboard,
  Package,
  Tags,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  Users,
  Settings,
  LogOut,
  Sun,
  Moon,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import type { UserRole } from "../types";
import logoSrc from "../assets/logo.jpg";

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

interface SidebarProps {
  onCloseMobile?: () => void;
}

const menuItems: MenuItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/products", label: "Products", icon: Package },
  { path: "/categories", label: "Categories", icon: Tags },
  { path: "/stock-in", label: "Stock In", icon: ArrowDownToLine },
  { path: "/stock-out", label: "Stock Out", icon: ArrowUpFromLine },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/users", label: "Users", icon: Users, roles: ["super_admin", "admin"] },
  { path: "/settings", label: "Settings", icon: Settings, roles: ["super_admin"] },
];

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const location = useLocation();
  const { session, logout, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const visibleMenuItems = menuItems.filter((item) =>
    !item.roles || hasRole(item.roles)
  );

  return (
    <aside className="w-56 bg-sidebar-light dark:bg-sidebar-dark h-full flex flex-col text-white overflow-y-auto">
      {/* Header with Theme Toggle */}
      <div className="px-3 py-3 border-b border-gray-700 flex items-center gap-3 flex-shrink-0">
        <img 
          src={logoSrc} 
          alt="Stock Management Font Logo" 
          className="w-12 h-12 rounded-lg object-cover"
        />
        <h1 className="text-base font-bold flex-1 truncate">Stock Font</h1>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-white/10 transition-colors"
          title={theme === "light" ? "Dark Mode" : "Light Mode"}
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-2 rounded-md hover:bg-white/10 transition-colors md:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {visibleMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-colors ${
                isActive
                  ? "bg-primary/20 border-l-4 border-primary"
                  : "hover:bg-white/10"
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section with Logout */}
      <div className="px-3 py-2 border-t border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-semibold text-xs">
            {session?.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{session?.username}</p>
            <p className="text-[10px] text-gray-400">{session?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-white/10 transition-colors text-gray-300 text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
