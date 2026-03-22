import { useCallback } from "react";
import api from "../services/api";

export function useWhatsApp() {
  const enviarWhatsApp = useCallback(
    async (tipo: "invoice" | "estimate", id: number) => {
      try {
        const url = `/${tipo}s/${id}/send-whatsapp`;

        console.log("📡 Chamando endpoint:", url);

        const response = await api.post(url); // ✅ POST correto

        console.log("✅ Resposta API:", response.data);

        const { whatsappLink } = response.data;

        if (!whatsappLink) {
          throw new Error("Link do WhatsApp não retornado");
        }

        window.open(whatsappLink, "_blank");
      } catch (error: any) {
        console.error("❌ Erro completo:", error);

        if (error.response) {
          console.error("📛 Backend respondeu:", error.response.data);
        }

        alert(
          error.response?.data?.message ||
            "Erro ao enviar WhatsApp. Verifique o backend."
        );
      }
    },
    []
  );

  return { enviarWhatsApp };
}