import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  define: {
    // Evita erro de import.meta em ambientes que não suportam
    "import.meta.env": JSON.stringify(process.env),
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  optimizeDeps: {
    include: ["@tanstack/react-query"],
  },
  build: {
    outDir: "dist",
    target: "es2020", // força módulos ES
  },
  preview: {
    host: true,
    port: 8080,
  },
});