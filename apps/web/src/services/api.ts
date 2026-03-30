import axios from "axios";

// Garantir que a URL base termine com /api
const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
// Remove barra final se existir
const API_URL = baseUrl.replace(/\/$/, "");

console.log("🔧 API_URL (produção):", API_URL);

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Detecta HTML da Vercel (erro 404 ou offline)
    if (
      error.response &&
      typeof error.response.data === "string" &&
      error.response.data.includes("<!doctype")
    ) {
      console.error(
        "🚨 Backend offline ou URL incorreta. Verifique VITE_API_URL."
      );
      console.error("URL chamada:", error.config?.baseURL + error.config?.url);
    }

    const isLoginRequest = error.config?.url?.includes("/auth/login");

    if (error.response?.status === 401 && !isLoginRequest) {
      console.warn("🔐 Token expirado. Fazendo logout...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("oficina");
      window.location.replace("/login");
    }

    return Promise.reject(error);
  }
);

export const login = async (data: { email: string; password: string }) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const logout = async () => {
  await api.post("/auth/logout");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("oficina");
  window.location.href = "/login";
};

export const registerTenant = async (data: {
  officeName: string;
  documentType: string;
  documentNumber: string;
  cep: string;
  address: string;
  email: string;
  phone: string;
  ownerName: string;
  password: string;
  paymentCompleted: boolean;
  preapprovalId?: string;
}) => {
  const response = await api.post("/auth/register-tenant", data);
  return response.data;
};

export const sendWhatsApp = async (
  tipo: "invoice" | "estimate",
  id: number
) => {
  const response = await api.post(`/${tipo}s/${id}/send-whatsapp`);
  return response.data;
};

export { api };
export default api;