// apps/web/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

interface User {
  id: number;        // ou string, depende do seu backend – no schema é Int
  email: string;
  name: string;
  officeName?: string | null;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });

    // 🔥 CORREÇÃO: a API retorna "accessToken" (camelCase), não "access_token"
    const { accessToken, user } = response.data;

    if (!accessToken) throw new Error("Token não recebido da API");
    if (!user) throw new Error("Dados do usuário não recebidos");

    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);

    api.post("/auth/logout").catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}