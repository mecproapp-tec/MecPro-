// src/pages/private/Configuracoes/Configuracoes.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiAlertTriangle } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";

export default function Configuracoes() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [processando, setProcessando] = useState(false);

  const iconColor = "#00e5ff";
  const bgCard = "#1a1a1a";
  const bgInput = "#2a2a2a";

  const handleDarBaixa = () => {
    setMostrarConfirmacao(true);
  };

  const confirmarDarBaixa = async () => {
    setProcessando(true);
    // Simular chamada à API para cancelar plano
    setTimeout(() => {
      console.log("Plano cancelado para usuário:", user?.id);
      logout();
      navigate("/login");
    }, 1500);
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
        {/* Cabeçalho com botão voltar */}
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
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
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
          Configurações
        </h1>

        {/* Card principal */}
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
          {/* Informações da conta */}
          <div style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                marginBottom: "16px",
                color: "#fff",
              }}
            >
              Informações da Conta
            </h2>
            <p style={{ color: "#ccc", marginBottom: "8px" }}>
              <span style={{ color: iconColor }}>Email:</span> {user?.email}
            </p>
            <p style={{ color: "#ccc" }}>
              <span style={{ color: iconColor }}>Plano:</span> Premium (pode ser alterado futuramente)
            </p>
          </div>

          {/* Preferências (futuro) */}
          <div style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                marginBottom: "16px",
                color: "#fff",
              }}
            >
              Preferências
            </h2>
            <p style={{ color: "#888" }}>Em breve: tema, suporte tecnico, etc.</p>
          </div>

          {/* Zona de perigo */}
          <div style={{ borderTop: "1px solid #333", paddingTop: "24px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                marginBottom: "16px",
                color: "#ff6b6b",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FiAlertTriangle color="#ff6b6b" /> Zona de Perigo
            </h2>
            <p style={{ color: "#aaa", marginBottom: "20px", lineHeight: "1.6" }}>
              By cancelling your plan, you will lose access to the system and all data will be deleted after confirmation. This action may be irreversible. Do you wish to continue?
            </p>
            <button
              onClick={handleDarBaixa}
              style={{
                background: "#ff4444",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "14px 24px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#cc0000")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#ff4444")}
            >
              continuar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmação */}
      {mostrarConfirmacao && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "16px",
          }}
          onClick={() => !processando && setMostrarConfirmacao(false)}
        >
          <div
            style={{
              background: bgCard,
              borderRadius: "16px",
              border: "1px solid rgba(255, 68, 68, 0.3)",
              maxWidth: "400px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#ff6b6b",
                marginBottom: "12px",
              }}
            >
              Confirmar cancelamento
            </h3>
            <p style={{ color: "#ccc", marginBottom: "24px", lineHeight: "1.6" }}>
              Tem certeza que deseja cancelar seu plano? Esta ação não poderá ser desfeita e todos os seus dados serão perdidos.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setMostrarConfirmacao(false)}
                disabled={processando}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1px solid #444",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: processando ? "not-allowed" : "pointer",
                  opacity: processando ? 0.5 : 1,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!processando) e.currentTarget.style.background = "#333";
                }}
                onMouseLeave={(e) => {
                  if (!processando) e.currentTarget.style.background = "transparent";
                }}
              >
                Voltar
              </button>
              <button
                onClick={confirmarDarBaixa}
                disabled={processando}
                style={{
                  flex: 1,
                  background: "#ff4444",
                  border: "none",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: processando ? "not-allowed" : "pointer",
                  opacity: processando ? 0.5 : 1,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!processando) e.currentTarget.style.background = "#cc0000";
                }}
                onMouseLeave={(e) => {
                  if (!processando) e.currentTarget.style.background = "#ff4444";
                }}
              >
                {processando ? "Cancelando..." : "Confirmar cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}