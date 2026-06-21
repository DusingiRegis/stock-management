import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Database, Save } from "lucide-react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
export function Settings() {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { session } = useAuth();
    const { showToast } = useToast();
    useEffect(() => {
        loadSettings();
    }, []);
    const loadSettings = async () => {
        const res = await window.api.settings.get();
        if (res.success) {
            setSettings(res.data || {});
        }
    };
    const handleSaveSettings = async () => {
        if (!session)
            return;
        try {
            setSaving(true);
            const res = await window.api.settings.update(settings, session.userId);
            if (res.success) {
                showToast("success", "Settings saved");
            }
            else {
                showToast("error", res.error || "Failed to save settings");
            }
        }
        catch (error) {
            showToast("error", "Failed to save settings");
        }
        finally {
            setSaving(false);
        }
    };
    const handleBackup = async () => {
        if (!session)
            return;
        try {
            setLoading(true);
            const res = await window.api.settings.backupDatabase(session.userId);
            if (res.success) {
                showToast("success", "Database backed up successfully");
            }
            else {
                showToast("error", res.error || "Failed to backup database");
            }
        }
        catch (error) {
            showToast("error", "Failed to backup database");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Settings" }), _jsxs("button", { onClick: handleSaveSettings, disabled: saving, className: "flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-md hover:bg-blue-600 disabled:opacity-50", children: [_jsx(Save, { className: "w-4 h-4" }), saving ? _jsx(LoadingSpinner, { size: "sm" }) : "Save Settings"] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white dark:bg-surface-dark rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-gray-900 dark:text-white", children: "Company Settings" }), _jsx("div", { className: "space-y-4", children: _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Company Name" }), _jsx("input", { type: "text", value: settings.company_name || "", onChange: (e) => setSettings({ ...settings, company_name: e.target.value }), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white" })] }) })] }), _jsxs("div", { className: "bg-white dark:bg-surface-dark rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-gray-900 dark:text-white", children: "Stock Settings" }), _jsx("div", { className: "space-y-4", children: _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Default Low Stock Threshold" }), _jsx("input", { type: "number", min: "0", value: settings.low_stock_threshold || 0, onChange: (e) => setSettings({
                                                ...settings,
                                                low_stock_threshold: parseInt(e.target.value) || 0,
                                            }), className: "w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white" })] }) })] }), _jsxs("div", { className: "bg-white dark:bg-surface-dark rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-gray-900 dark:text-white", children: "Data Management" }), _jsx("div", { className: "space-y-4", children: _jsxs("button", { onClick: handleBackup, disabled: loading, className: "flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-200", children: [_jsx(Database, { className: "w-4 h-4" }), loading ? "Backing up..." : "Backup Database"] }) })] })] })] }));
}
