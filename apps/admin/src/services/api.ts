import axios from "axios";

// 🌐 Base URL da API (produção + fallback local)
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

console.log("🔧 ADMIN API_URL:", API_URL);

// 🚀 Instância Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// 🔐 Interceptor de requisição (envia token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ❌ Interceptor de resposta (tratamento de erro)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🚨 Backend retornando HTML (erro comum de rota)
    if (
      error.response &&
      typeof error.response.data === "string" &&
      error.response.data.includes("<!doctype")
    ) {
      console.error("🚨 API retornou HTML (rota errada ou API offline)");
    }

    // 🔐 Token expirado
    if (error.response?.status === 401) {
      console.warn("🔐 Token expirado. Fazendo logout...");
      localStorage.removeItem("adminToken");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;