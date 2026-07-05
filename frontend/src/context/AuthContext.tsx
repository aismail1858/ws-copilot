import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiClient } from "../lib/api";

interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
  tier?: string;
  default_chat_model_id?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await apiClient.get<{ user: User | null }>("/api/auth/me");
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    await apiClient.post<{ user: User }>("/api/auth/login", { email, password });
    await checkAuth();
  };

  const register = async (email: string, password: string, displayName?: string) => {
    await apiClient.post<{ user: User }>("/api/auth/register", {
      email,
      password,
      display_name: displayName || "",
    });
    await checkAuth();
  };

  const logout = async () => {
    await apiClient.post("/api/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, isLoading: loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useUser() {
  const { user } = useAuth();
  return { user };
}