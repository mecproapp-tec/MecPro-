import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit, FiTrash2, FiCalendar, FiPlus, FiClock, FiArrowLeft, FiEye } from "react-icons/fi";

import { getClients, deleteClient, type Client, getVehicleDisplay } from "../../../services/clients";
import { getAppointments, type Appointment } from "../../../services/appointments";

export default function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Client[]>([]);
  const [agendamentos, setAgendamentos] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const carregarDados = async () => {
    setLoading(true);
    try {
      const clientesData = await getClients();
      // 🔥 Garante que clientesData seja array
      setClientes(Array.isArray(clientesData) ? clientesData : []);

      try {
        const agendamentosData = await getAppointments();
        setAgendamentos(Array.isArray(agendamentosData) ? agendamentosData : []);
      } catch (err) {
        console.warn("Agendamentos não disponíveis", err);
        setAgendamentos([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao carregar clientes");
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleExcluir = async (id: number) => {
    const confirmar = confirm("Tem certeza que deseja excluir este cliente?");
    if (!confirmar) return;
    try {
      await deleteClient(id);
      setClientes(clientes.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || "Erro ao excluir cliente");
    }
  };

  const proximoAgendamentoPorCliente = useMemo(() => {
    const agora = new Date();
    const futuros = agendamentos
      .filter(a => new Date(a.date) > agora)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const map = new Map<number, Appointment>();
    for (const a of futuros) {
      if (!map.has(a.clientId)) map.set(a.clientId, a);
    }
    return map;
  }, [agendamentos]);

  const obterProximoAgendamento = (clienteId: number): Appointment | null => {
    return proximoAgendamentoPorCliente.get(clienteId) || null;
  };

  const abrirAgendamento = (appointmentId: number) => {
    navigate(`/agendamento/ver/${appointmentId}`);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loading}>Carregando clientes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <button onClick={() => navigate("/home")} style={styles.backButton}>
              <FiArrowLeft />
            </button>
            <h1 style={styles.title}>Clientes</h1>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.totalBox}>
              Total: <span style={styles.totalValue}>{clientes.length} {clientes.length === 1 ? "cliente" : "clientes"}</span>
            </div>
            <button onClick={() => navigate("/clientes/novo")} style={styles.newButton}>
              <FiPlus size={20} /> Novo Cliente
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {clientes.map(cliente => {
            const proximoAgendamento = obterProximoAgendamento(cliente.id);
            return (
              <div key={cliente.id} style={styles.card}>
                <div style={styles.cardContent}>
                  <div style={styles.cardInfo}>
                    <span style={styles.clientName}>{cliente.name}</span>
                    <span style={styles.clientVehicle}>{cliente.vehicle || "Não informado"}</span>
                    <span style={styles.clientPlate}>{cliente.plate || "Não informado"}</span>
                    {proximoAgendamento && (
                      <button onClick={() => abrirAgendamento(proximoAgendamento.id)} style={styles.agendaButton}>
                        <FiClock size={16} />
                        {new Date(proximoAgendamento.date).toLocaleDateString("pt-BR")}
                      </button>
                    )}
                  </div>
                  <div style={styles.actions}>
                    <button onClick={() => navigate(`/clientes/ver/${cliente.id}`)} style={styles.actionButton} title="Ver cliente">
                      <FiEye size={18} />
                    </button>
                    <button onClick={() => navigate(`/clientes/editar/${cliente.id}`)} style={styles.actionButton} title="Editar">
                      <FiEdit size={18} />
                    </button>
                    <button onClick={() => handleExcluir(cliente.id)} style={{ ...styles.actionButton, color: "#ff5555", borderColor: "#ff555530" }} title="Excluir">
                      <FiTrash2 size={18} />
                    </button>
                    <button onClick={() => navigate(`/agendamento/novo/${cliente.id}`)} style={{ ...styles.actionButton, color: "#00ff99", borderColor: "#00ff9940" }} title="Agendar">
                      <FiCalendar size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {clientes.length === 0 && (
            <div style={styles.emptyMessage}>Nenhum cliente cadastrado.</div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)",
    minHeight: "100vh",
    padding: "48px 24px",
    color: "#e0e0e0",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "40px",
    flexWrap: "wrap",
    gap: "20px",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "16px" },
  backButton: {
    background: "#1a1a1a",
    border: "none",
    color: "#00e5ff",
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "24px",
    transition: "all 0.2s",
    boxShadow: "0 4px 12px rgba(0, 229, 255, 0.2)",
  },
  title: {
    fontSize: "clamp(32px, 5vw, 48px)",
    fontWeight: "700",
    background: "linear-gradient(135deg, #00e5ff, #7fdbff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: 0,
  },
  headerRight: { display: "flex", gap: "16px", alignItems: "center" },
  totalBox: {
    background: "#1a1a1a",
    padding: "12px 24px",
    borderRadius: "100px",
    fontWeight: "600",
    fontSize: "1.1rem",
    color: "#00e5ff",
    border: "1px solid #00e5ff30",
  },
  totalValue: { color: "#ffffff", marginLeft: "8px" },
  newButton: {
    background: "linear-gradient(135deg, #00e5ff, #0077ff)",
    color: "#000",
    padding: "12px 24px",
    borderRadius: "100px",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  card: {
    background: "#111",
    borderRadius: "24px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.8), 0 0 0 1px #00e5ff20",
  },
  cardContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  cardInfo: {
    display: "flex",
    flexWrap: "wrap",
    gap: "32px",
    alignItems: "center",
    flex: 1,
  },
  clientName: { fontWeight: 600, fontSize: "1.2rem", color: "#fff" },
  clientVehicle: { color: "#b0b0b0" },
  clientPlate: { color: "#b0b0b0", fontFamily: "monospace" },
  agendaButton: {
    background: "transparent",
    border: "1px solid #00ff9940",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#00ff99",
    padding: "4px 12px",
    borderRadius: "100px",
    fontSize: "0.9rem",
  },
  actions: { display: "flex", gap: "12px" },
  actionButton: {
    background: "#1a1a1a",
    border: "1px solid #00e5ff30",
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#00e5ff",
  },
  emptyMessage: {
    textAlign: "center",
    padding: "60px 16px",
    background: "#111",
    borderRadius: "24px",
    color: "#888",
    fontStyle: "italic",
  },
  loadingContainer: {
    background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loading: { color: "#00e5ff", fontSize: "18px" },
  errorContainer: {
    background: "linear-gradient(145deg, #0a0a0a 0%, #000000 100%)",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  error: { color: "#ff4444", fontSize: "18px" },
};