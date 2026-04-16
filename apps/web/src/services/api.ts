import axios from "axios";

// ✅ URL LIMPA E CONTROLADA
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL + "/api", // 🔥 prefixo correto
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

// 🔐 INTERCEPTOR REQUEST
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

// 🚨 INTERCEPTOR RESPONSE
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || "";

      console.error(`❌ ${status}:`, error.response.data);

      if (status === 401) {
        const isAuthError =
          message.includes("expired") ||
          message.includes("invalid") ||
          message.includes("Unauthorized");

        if (isAuthError) {
          console.warn("🔒 Token inválido → logout automático");

          localStorage.removeItem("token");
          localStorage.removeItem("user");

          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
      }
    } else if (error.code === "ERR_NETWORK") {
      console.error("❌ API offline ou URL errada");
    }

    return Promise.reject(error);
  }
);

export default api;