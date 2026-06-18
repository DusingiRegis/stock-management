import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { AuthSession, UserRole } from "../types";

interface AuthContextValue {
  session: AuthSession | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);

  const login = async (username: string, password: string): Promise<boolean> => {
    const result = await window.api.auth.login({ username, password });
    if (result.success && result.data) {
      setSession(result.data);
      return true;
    }
    return false;
  };

  const logout = async (): Promise<void> => {
    if (session) {
      await window.api.auth.logout(session.userId);
    }
    setSession(null);
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!session) return false;
    return roles.includes(session.role);
  };

  return (
    <AuthContext.Provider value={{ session, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
