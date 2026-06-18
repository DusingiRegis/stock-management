
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
    return <Login />;
  }

  return (
    <div className="flex h-full w-full">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <Sidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-bg-light dark:bg-bg-dark">
        {/* Mobile Header with Hamburger */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-bg-light dark:bg-bg-dark sticky top-0 z-30">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Stock Font</h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/stock-in" element={<StockIn />} />
            <Route path="/stock-out" element={<StockOut />} />
            <Route path="/reports" element={<Reports />} />
            <Route
              path="/users"
              element={
                <ProtectedRoute roles={["super_admin", "admin"]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute roles={["super_admin"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <AppContent />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
