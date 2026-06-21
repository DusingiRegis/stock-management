import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export function ProtectedRoute({ children, roles }) {
    const { session, hasRole } = useAuth();
    if (!session) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    if (roles && !hasRole(roles)) {
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
