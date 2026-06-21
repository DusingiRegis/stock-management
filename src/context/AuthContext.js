import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const login = async (username, password) => {
        const result = await window.api.auth.login({ username, password });
        if (result.success && result.data) {
            setSession(result.data);
            return true;
        }
        return false;
    };
    const logout = async () => {
        if (session) {
            await window.api.auth.logout(session.userId);
        }
        setSession(null);
    };
    const hasRole = (roles) => {
        if (!session)
            return false;
        return roles.includes(session.role);
    };
    return (_jsx(AuthContext.Provider, { value: { session, login, logout, hasRole }, children: children }));
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
