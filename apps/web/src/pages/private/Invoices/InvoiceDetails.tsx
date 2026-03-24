import React, { useState } from 'react';
import { useWhatsApp } from '../../../hooks/useWhatsApp';

interface Invoice {
  id: number;
  number: string;
  total: number;
  client: {
    name: string;
    phone: string;
  };
}

interface InvoiceDetailsProps {
  invoice: Invoice;
}

export const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ invoice }) => {
  const { enviarWhatsApp } = useWhatsApp();
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    await enviarWhatsApp('invoice', invoice.id);
    setSending(false);
  };

  return (
    <div>
      <h2>Fatura #{invoice.number}</h2>
      <p><strong>Cliente:</strong> {invoice.client.name}</p>
      <p><strong>Telefone:</strong> {invoice.client.phone || 'Não cadastrado'}</p>
      <p><strong>Total:</strong> R$ {invoice.total.toFixed(2)}</p>
      <button
        onClick={handleSend}
        disabled={sending || !invoice.client.phone}
      >
        {sending ? 'Enviando...' : 'Enviar via WhatsApp'}
      </button>
    </div>
  );
};