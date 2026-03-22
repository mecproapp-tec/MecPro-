import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft, FiSend } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";

export default function FAQ() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  // Verifica se a URL tem ?success=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("success") === "true") {
      setSucesso(true);
      // Remove o parâmetro da URL após 5 segundos (sem recarregar a página)
      const timeout = setTimeout(() => {
        setSucesso(false);
        navigate(location.pathname, { replace: true });
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [location, navigate]);

  const iconColor = "#00e5ff";
  const bgCard = "#1a1a1a";
  const bgInput = "#2a2a2a";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensagem.trim() || carregando) return;

    setCarregando(true);
    setErro("");

    try {
      await api.post("/contact", {
        userEmail: user?.email,
        userName: user?.officeName || user?.name,
        message: mensagem,
      });

      // ✅ Recarrega a página com o parâmetro de sucesso
      window.location.href = "/faq?success=true";
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      setErro(error.response?.data?.message || "Erro ao enviar. Tente novamente.");
      setCarregando(false);
    }
  };

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)",
        minHeight: "100vh",
        padding: "48px 24px",
        color: "#e0e0e0",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ marginBottom: "40px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "transparent",
              border: "none",
              color: iconColor,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "18px",
              cursor: "pointer",
              padding: "8px 0",
              transition: "opacity 0.2s",
            }}
          >
            <FiArrowLeft size={24} /> Voltar
          </button>
        </div>

        <h1
          style={{
            fontSize: "clamp(32px, 6vw, 48px)",
            fontWeight: "700",
            marginBottom: "32px",
            color: "#fff",
            textShadow: "0 0 10px rgba(0, 229, 255, 0.5)",
          }}
        >
          FAQ - Fale com o Admin
        </h1>

        <div
          style={{
            background: bgCard,
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 10px 30px rgba(0, 229, 255, 0.1)",
            border: "1px solid rgba(0, 229, 255, 0.2)",
            marginBottom: "48px",
          }}
        >
          <p style={{ color: "#ccc", marginBottom: "24px", fontSize: "16px", lineHeight: "1.6" }}>
            Tem alguma dúvida, sugestão ou problema? Envie uma mensagem para a administração. Responderemos em breve.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="mensagem"
                style={{ display: "block", marginBottom: "8px", color: "#aaa", fontSize: "14px" }}
              >
                Sua mensagem
              </label>
              <textarea
                id="mensagem"
                rows={5}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite sua mensagem..."
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: bgInput,
                  border: "1px solid #3a3a3a",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "16px",
                  resize: "vertical",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = iconColor)}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#3a3a3a")}
                required
              />
            </div>

            {erro && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px",
                  background: "rgba(255, 0, 0, 0.1)",
                  border: "1px solid #ff4444",
                  color: "#ff8888",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                {erro}
              </div>
            )}

            {sucesso && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px",
                  background: "rgba(0, 255, 0, 0.1)",
                  border: "1px solid #00ff00",
                  color: "#00ff00",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                Mensagem enviada com sucesso! Em breve você será contatado pela administração.
              </div>
            )}

            <button
              type="submit"
              disabled={carregando || !mensagem.trim()}
              style={{
                background: iconColor,
                color: "#000",
                border: "none",
                borderRadius: "8px",
                padding: "14px 24px",
                fontSize: "18px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                cursor: carregando || !mensagem.trim() ? "not-allowed" : "pointer",
                opacity: carregando || !mensagem.trim() ? 0.6 : 1,
                transition: "background 0.2s",
              }}
            >
              {carregando ? "Enviando..." : (
                <>
                  <FiSend size={20} /> Enviar Mensagem
                </>
              )}
            </button>
          </form>
        </div>

        <div>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "600",
              marginBottom: "24px",
              color: "#fff",
              textShadow: "0 0 5px rgba(0, 229, 255, 0.3)",
            }}
          >
            Perguntas Frequentes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              {
                pergunta: "Como faço para cancelar meu plano?",
                resposta: "Você pode cancelar seu plano acessando 'Configurações' e clicando em 'Dar baixa no plano'. O cancelamento será processado e você receberá a confirmação por e-mail.",
              },
              {
                pergunta: "Como atualizar os dados da oficina?",
                resposta: "Acesse o menu e clique em 'Dados da Oficina'. Lá você pode editar nome, endereço, telefone e outras informações.",
              },
              {
                pergunta: "Como funcionam as notificações?",
                resposta: "As notificações alertam sobre agendamentos, vencimentos e outras atualizações importantes. Você pode visualizá-las no ícone do sino ou no menu 'Notificações'.",
              },
            ].map((item, index) => (
              <details
                key={index}
                style={{
                  background: bgCard,
                  borderRadius: "12px",
                  padding: "16px",
                  border: "1px solid rgba(0, 229, 255, 0.1)",
                  cursor: "pointer",
                }}
              >
                <summary
                  style={{
                    fontWeight: "500",
                    color: "#fff",
                    fontSize: "18px",
                    outline: "none",
                  }}
                >
                  {item.pergunta}
                </summary>
                <p style={{ marginTop: "12px", color: "#aaa", fontSize: "15px", lineHeight: "1.5" }}>
                  {item.resposta}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}