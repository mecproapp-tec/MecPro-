import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiPlus, FiX, FiArrowLeft } from "react-icons/fi";

import { getClients, type Client } from "../../../services/clients";
import {
  getEstimateById,
  createEstimate,
  updateEstimate,
  type EstimateItem,
  type CreateEstimateData,
} from "../../../services/Estimates";

export default function NovoOrcamento() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [clientes, setClientes] = useState<Client[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Client | null>(null);
  const [busca, setBusca] = useState("");

  const [itens, setItens] = useState<EstimateItem[]>([
    { description: "", price: 0, issPercent: undefined },
  ]);

  const [dataOrcamento, setDataOrcamento] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [orcamentoCarregado, setOrcamentoCarregado] = useState<any>(null);

  // ===== Função para calcular total de um item (com ISS) =====
  const calcularTotalItem = (item: EstimateItem): number => {
    const price = item.price || 0;
    const iss = item.issPercent ? price * (item.issPercent / 100) : 0;
    return price + iss;
  };

  // ===== Total geral =====
  const totalGeral = itens.reduce((acc, item) => acc + calcularTotalItem(item), 0);

  useEffect(() => {
    carregarClientes();
  }, []);

  useEffect(() => {
    if (isEditing) {
      carregarOrcamento();
    }
  }, [id]);

  useEffect(() => {
    if (orcamentoCarregado && clientes.length > 0) {
      const cliente = clientes.find((c) => c.id === orcamentoCarregado.clientId) || null;
      setClienteSelecionado(cliente);
      setItens(orcamentoCarregado.items);
      setDataOrcamento(orcamentoCarregado.date.split("T")[0]);
    }
  }, [clientes, orcamentoCarregado]);

  const carregarClientes = async () => {
    try {
      const data = await getClients();
      setClientes(data);
    } catch (err) {
      console.error("Erro ao carregar clientes", err);
    }
  };

  const carregarOrcamento = async () => {
    try {
      const orcamento = await getEstimateById(Number(id));
      setOrcamentoCarregado(orcamento);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao carregar orçamento");
    }
  };

  const handleAddItem = () => {
    setItens([...itens, { description: "", price: 0, issPercent: undefined }]);
  };

  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof EstimateItem,
    value: string | number
  ) => {
    const novos = [...itens];
    if (field === "price") {
      novos[index].price = typeof value === "string" ? parseFloat(value) || 0 : value;
    } else if (field === "issPercent") {
      novos[index].issPercent = value === "" ? undefined : Number(value);
    } else {
      novos[index].description = value as string;
    }
    setItens(novos);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteSelecionado) return;

    setLoading(true);
    setError("");

    const payload: CreateEstimateData = {
      clientId: clienteSelecionado.id,
      date: dataOrcamento,
      items: itens.map((item) => ({
        description: item.description,
        price: item.price,
        issPercent: item.issPercent,
      })),
    };

    try {
      if (isEditing) {
        await updateEstimate(Number(id), payload);
      } else {
        await createEstimate(payload);
      }
      navigate("/orcamentos");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao salvar orçamento");
    } finally {
      setLoading(false);
    }
  };

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.name.toLowerCase().includes(busca.toLowerCase()) ||
      c.plate.toLowerCase().includes(busca.toLowerCase())
  );

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
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Cabeçalho */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "40px" }}>
          <button
            onClick={() => navigate("/orcamentos")}
            style={{
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
              marginRight: "16px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#1a1a1a")}
          >
            <FiArrowLeft />
          </button>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: "700",
              background: "linear-gradient(135deg, #00e5ff, #7fdbff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
            }}
          >
            {isEditing ? "Editar Orçamento" : "Novo Orçamento"}
          </h1>
        </div>

        {/* Formulário */}
        <div
          style={{
            background: "#111",
            borderRadius: "24px",
            padding: "40px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px #00e5ff20",
          }}
        >
          {error && (
            <div
              style={{
                background: "#ff444420",
                border: "1px solid #ff4444",
                color: "#ff8888",
                padding: "12px 16px",
                borderRadius: "12px",
                marginBottom: "24px",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* Cliente */}
            <div>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "#a0a0a0" }}>
                Cliente (nome ou placa)
              </label>
              {!isEditing && (
                <>
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Digite para buscar..."
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: "16px",
                      border: "1px solid #333",
                      background: "#1a1a1a",
                      color: "#fff",
                      fontSize: "16px",
                      outline: "none",
                      transition: "border 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#00e5ff")}
                    onBlur={(e) => (e.target.style.borderColor = "#333")}
                  />
                  {busca && (
                    <div
                      style={{
                        marginTop: "8px",
                        background: "#222",
                        borderRadius: "16px",
                        maxHeight: "200px",
                        overflowY: "auto",
                        border: "1px solid #00e5ff30",
                      }}
                    >
                      {clientesFiltrados.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setClienteSelecionado(c);
                            setBusca("");
                          }}
                          style={{
                            padding: "14px 16px",
                            cursor: "pointer",
                            borderBottom: "1px solid #333",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#333")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          {c.name} - {c.plate}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              {clienteSelecionado && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "16px",
                    background: "#1a1a1a",
                    borderRadius: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid #00e5ff30",
                  }}
                >
                  <span style={{ fontSize: "16px", color: "#fff" }}>
                    {clienteSelecionado.name} - {clienteSelecionado.plate}
                  </span>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setClienteSelecionado(null)}
                      style={{
                        color: "#ff5555",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "20px",
                      }}
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Data */}
            <div>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "#a0a0a0" }}>
                Data do Orçamento
              </label>
              <input
                type="date"
                value={dataOrcamento}
                onChange={(e) => setDataOrcamento(e.target.value)}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "1px solid #333",
                  background: "#1a1a1a",
                  color: "#fff",
                  fontSize: "16px",
                  outline: "none",
                }}
                required
              />
            </div>

            {/* Itens */}
            <div>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "#a0a0a0" }}>
                Itens do Orçamento
              </label>
              {itens.map((item, index) => (
                <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Descrição"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    style={{
                      flex: 2,
                      minWidth: "200px",
                      padding: "16px",
                      borderRadius: "16px",
                      border: "1px solid #333",
                      background: "#1a1a1a",
                      color: "#fff",
                      fontSize: "16px",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#00e5ff")}
                    onBlur={(e) => (e.target.style.borderColor = "#333")}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Valor"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, "price", e.target.value)}
                    style={{
                      width: "140px",
                      padding: "16px",
                      borderRadius: "16px",
                      border: "1px solid #333",
                      background: "#1a1a1a",
                      color: "#fff",
                      fontSize: "16px",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#00e5ff")}
                    onBlur={(e) => (e.target.style.borderColor = "#333")}
                    required
                    min="0"
                    step="0.01"
                  />
                  <select
                    value={item.issPercent ?? ""}
                    onChange={(e) => handleItemChange(index, "issPercent", e.target.value)}
                    style={{
                      width: "100px",
                      padding: "16px",
                      borderRadius: "16px",
                      border: "1px solid #333",
                      background: "#1a1a1a",
                      color: "#fff",
                      fontSize: "16px",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#00e5ff")}
                    onBlur={(e) => (e.target.style.borderColor = "#333")}
                  >
                    <option value="">ISS</option>
                    <option value="2">2%</option>
                    <option value="3">3%</option>
                    <option value="4">4%</option>
                    <option value="5">5%</option>
                  </select>
                  {/* Exibe total do item */}
                  <span style={{ padding: "16px", color: "#00e5ff", fontWeight: "600", minWidth: "100px", textAlign: "right" }}>
                    R$ {calcularTotalItem(item).toFixed(2)}
                  </span>
                  {itens.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      style={{
                        color: "#ff5555",
                        background: "#1a1a1a",
                        border: "1px solid #ff555530",
                        width: "48px",
                        height: "48px",
                        borderRadius: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#ff555520";
                        e.currentTarget.style.borderColor = "#ff5555";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#1a1a1a";
                        e.currentTarget.style.borderColor = "#ff555530";
                      }}
                    >
                      <FiX size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#00e5ff",
                  background: "transparent",
                  border: "1px solid #00e5ff40",
                  padding: "12px 24px",
                  borderRadius: "100px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "1rem",
                  marginTop: "8px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#00e5ff10";
                  e.currentTarget.style.borderColor = "#00e5ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "#00e5ff40";
                }}
              >
                <FiPlus size={18} /> Adicionar Item
              </button>
            </div>

            {/* Total geral */}
            <div style={{ textAlign: "right", fontSize: "28px", fontWeight: "700", color: "#00e5ff" }}>
              Total: R$ {totalGeral.toFixed(2)}
            </div>

            {/* Botão submit */}
            <button
              type="submit"
              disabled={loading || !clienteSelecionado}
              style={{
                width: "100%",
                padding: "18px",
                borderRadius: "100px",
                background: "linear-gradient(135deg, #00e5ff, #0077ff)",
                color: "#000",
                fontWeight: "700",
                fontSize: "1.1rem",
                border: "none",
                cursor: clienteSelecionado && !loading ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                opacity: clienteSelecionado && !loading ? 1 : 0.5,
                boxShadow: "0 8px 20px rgba(0, 229, 255, 0.3)",
              }}
              onMouseEnter={(e) => {
                if (clienteSelecionado && !loading) {
                  e.currentTarget.style.transform = "scale(1.02)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {loading ? "Salvando..." : isEditing ? "Atualizar Orçamento" : "Criar Orçamento"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}