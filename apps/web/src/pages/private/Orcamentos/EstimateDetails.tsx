import React, { useState } from 'react';
import { useWhatsApp } from '../../../hooks/useWhatsApp';



interface Estimate {
  id: number;
  total: number;
  client: {
    name: string;
    phone: string;
  };
}

interface EstimateDetailsProps {
  estimate: Estimate;
}

export const EstimateDetails: React.FC<EstimateDetailsProps> = ({ estimate }) => {
  const { enviarWhatsApp } = useWhatsApp();
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    await enviarWhatsApp('estimate', estimate.id);
    setSending(false);
  };

  return (
    <div>
      <h2>Orçamento #{estimate.id}</h2>
      <p><strong>Cliente:</strong> {estimate.client.name}</p>
      <p><strong>Telefone:</strong> {estimate.client.phone || 'Não cadastrado'}</p>
      <p><strong>Total:</strong> R$ {estimate.total.toFixed(2)}</p>
      <button
        onClick={handleSend}
        disabled={sending || !estimate.client.phone}
      >
        {sending ? 'Enviando...' : 'Enviar via WhatsApp'}
      </button>
    </div>
  );
};