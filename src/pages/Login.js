import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { LoadingSpinner } from "../components/LoadingSpinner";
import logoSrc from "../assets/android-chrome-512x512.png";
export function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const success = await login(username, password);
        setIsLoading(false);
        if (success) {
            navigate("/dashboard");
        }
        else {
            showToast("error", "Invalid credentials");
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center", children: _jsxs("div", { className: "bg-surface-light dark:bg-surface-dark p-8 rounded-lg shadow-lg w-full max-w-md", children: [_jsx("div", { className: "flex justify-center mb-6", children: _jsx("img", { src: logoSrc, alt: "Inventory System Logo", className: "w-32 h-32 rounded-lg object-cover" }) }), _jsx("h1", { className: "text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white", children: "Cyuzuzo" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Username" }), _jsx("input", { type: "text", value: username, onChange: (e) => setUsername(e.target.value), className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPassword ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300", children: showPassword ? _jsx(EyeOff, { size: 20 }) : _jsx(Eye, { size: 20 }) })] })] }), _jsx("button", { type: "submit", disabled: isLoading, className: "w-full bg-primary text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2", children: isLoading ? _jsx(LoadingSpinner, { size: "sm" }) : "Login" })] })] }) }));
}
