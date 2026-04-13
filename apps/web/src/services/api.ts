// apps/web/src/services/api.ts
import axios from "axios";

// 🔥 CORREÇÃO: Remove o /api da baseURL (o backend decide se usa prefixo)
const baseUrl =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD
    ? "https://api.mecpro.tec.br"      // ← SEM /api
    : "http://localhost:3000");        // ← SEM /api

const API_URL = baseUrl.replace(/\/$/, "");

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(`❌ Erro ${error.response.status} em ${error.config?.url}:`, error.response.data);
    } else {
      console.error("❌ Erro de rede:", error.message);
    }
    return Promise.reject(error);
  }
);

export const login = async (data: { email: string; password: string }) => {
  const response = await api.post("/api/auth/login", data);
  return response.data;
};

export const logout = async () => {
  try {
    await api.post("/api/auth/logout");
  } catch (e) {}
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

export const registerTenant = async (data: any) => {
  const response = await api.post("/api/auth/register-tenant", data);
  return response.data;
};

// 🔥 CORREÇÃO: Agora aceita phoneNumber opcional e envia no corpo
export const sendWhatsApp = async (
  tipo: "invoice" | "estimate",
  id: number,
  phoneNumber?: string
) => {
  const response = await api.post(`/api/${tipo}s/${id}/send-whatsapp`, { phoneNumber });
  return response.data; // { success, whatsappUrl, message }
};

export { api };
export default api;