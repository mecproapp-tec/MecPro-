import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

interface PrivateRouteProps {
  children: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user } = useAuth();

  // ✅ Verifica autenticação corretamente
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}