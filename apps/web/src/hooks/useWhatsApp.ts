import { sendWhatsApp } from '../services/api';

export const useWhatsApp = () => {
  const enviarWhatsApp = async (
    tipo: 'invoice' | 'estimate',
    id: number,
    phoneNumber?: string
  ) => {
    try {
      const result = await sendWhatsApp(tipo, id, phoneNumber);
      // sendWhatsApp já retorna { whatsappUrl, message, success? }
      if (result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank');
        return { success: true };
      } else {
        alert(result.message || 'Erro ao enviar');
        return { success: false };
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Erro ao enviar WhatsApp');
      return { success: false, error };
    }
  };
  return { enviarWhatsApp };
};