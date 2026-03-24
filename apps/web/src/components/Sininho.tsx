import { useEffect, useState } from "react";
import { FiBell } from "react-icons/fi";
import { getNotifications } from "../services/notifications";

export default function Sininho() {
  const [total, setTotal] = useState(0);

useEffect(() => {
  const fetchNotificacoes = async () => {
    try {
      console.log('Buscando notificações...');
      const data = await getNotifications();
      console.log('Dados recebidos:', data);
      const naoLidas = data.filter((n) => !n.read).length;
      console.log('Não lidas:', naoLidas);
      setTotal(naoLidas);
    } catch (error) {
      console.error("Erro ao carregar notificações", error);
    }
  };
  fetchNotificacoes();
  const interval = setInterval(fetchNotificacoes, 30000);
  return () => clearInterval(interval);
}, []);

  return (
    <div style={{ position: "relative", cursor: "pointer" }}>
      <FiBell size={26} color="#00e5ff" />
      {total > 0 && (
        <div
          style={{
            position: "absolute",
            top: "-6px",
            right: "-8px",
            background: "red",
            color: "#fff",
            borderRadius: "50%",
            width: "18px",
            height: "18px",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {total}
        </div>
      )}
    </div>
  );
}