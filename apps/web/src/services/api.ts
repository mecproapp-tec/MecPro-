import axios from "axios";

const baseUrl =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD
    ? "https://api.mecpro.tec.br/api"
    : "http://localhost:3000/api");

const API_URL = baseUrl.replace(/\/$/, "");

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  if (config.url?.includes("/public/")) {
    return config;
  }
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url || "";
      const message = error.response.data?.message || "";

      console.error(`❌ Erro ${status} em ${url}:`, error.response.data);

      if (status === 401) {
        const isTokenExpired =
          message.includes("expired") ||
          message.includes("invalid") ||
          message.includes("Unauthorized");

        if (isTokenExpired) {
          console.warn("🔒 Token expirado ou inválido. Redirecionando para login...");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        } else {
          console.warn("⚠️ Erro 401 mas token ainda válido (possível falta de permissão). Mantendo sessão.");
        }
      } else if (status === 403) {
        console.error("Acesso negado (403):", url);
      } else if (status >= 500) {
        console.error("Erro interno no servidor:", error.response.data);
      }
    } else if (error.code === "ECONNABORTED") {
      console.error("Timeout na requisição:", error.config?.url);
    } else if (error.code === "ERR_NETWORK") {
      console.error("❌ Erro de rede. Verifique se o backend está rodando.");
    } else {
      console.error("❌ Erro:", error.message);
    }

    return Promise.reject(error);
  }
);

export const login = async (data: { email: string; password: string }) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch {}
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

export const registerTenant = async (data: any) => {
  const response = await api.post("/auth/register-tenant", data);
  return response.data;
};

export const sendInvoiceWhatsApp = async (invoiceId: number, phoneNumber?: string) => {
  const response = await api.post(`/invoices/${invoiceId}/send-whatsapp`, { phoneNumber });
  return response.data;
};

export const sendEstimateWhatsApp = async (estimateId: number, phoneNumber?: string) => {
  const response = await api.post(`/estimates/${estimateId}/send-whatsapp`, { phoneNumber });
  return response.data;
};

export const sendWhatsApp = async (
  tipo: "invoice" | "estimate",
  id: number,
  phoneNumber?: string
) => {
  const response = await api.post(`/${tipo}s/${id}/send-whatsapp`, { phoneNumber });
  return response.data;
};

export default api;