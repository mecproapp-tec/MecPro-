import api from "./api";

export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
  total: number;
  issPercent?: number;
}

export interface Invoice {
  id: number;
  clientId: number;
  number: string;
  total: number;
  status: "PENDING" | "PAID" | "CANCELED";
  pdfUrl?: string;
  pdfStatus?: string;
  pdfGeneratedAt?: string;
  createdAt: string;
  updatedAt?: string;
  shareToken?: string;
  shareTokenExpires?: string;
  items: InvoiceItem[];
  client?: {
    id: number;
    name: string;
    phone: string;
    vehicle: string;
    plate: string;
    address?: string;
    document?: string;
  };
}

export interface CreateInvoiceData {
  clientId: number;
  estimateId?: number;
  items: Omit<InvoiceItem, "id" | "total">[];
  status?: "PENDING" | "PAID" | "CANCELED";
}

export const getInvoices = async (page = 1, limit = 50): Promise<{ data: Invoice[]; total: number; page: number; limit: number; totalPages: number }> => {
  try {
    const response = await api.get(`/invoices?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) return { data: [], total: 0, page: 1, limit, totalPages: 0 };
    throw error;
  }
};

export const getInvoiceById = async (id: number): Promise<Invoice> => {
  const response = await api.get(`/invoices/${id}`);
  return response.data;
};

export const createInvoice = async (data: CreateInvoiceData): Promise<Invoice> => {
  const response = await api.post("/invoices", data);
  return response.data;
};

export const updateInvoice = async (id: number, data: CreateInvoiceData): Promise<Invoice> => {
  const response = await api.put(`/invoices/${id}`, data);
  return response.data;
};

export const deleteInvoice = async (id: number): Promise<void> => {
  await api.delete(`/invoices/${id}`);
};

export function calculateTotalWithIss(items: InvoiceItem[]): number {
  return items.reduce((acc, item) => {
    const itemTotal = item.price * item.quantity;
    const iss = item.issPercent ? itemTotal * (item.issPercent / 100) : 0;
    return acc + itemTotal + iss;
  }, 0);
}

// 📲 Enviar fatura via WhatsApp (com phoneNumber opcional)
export const sendInvoiceWhatsApp = async (
  id: number,
  phoneNumber?: string
): Promise<{
  whatsappUrl?: string;
  message: string;
  success: boolean;
}> => {
  const response = await api.post(`/invoices/${id}/send-whatsapp`, { phoneNumber });
  return response.data; // { success, whatsappUrl, message }
};

// 🔗 Gerar token de compartilhamento
export const generateShareToken = async (id: number): Promise<{ token: string }> => {
  const response = await api.post(`/invoices/${id}/share`);
  return response.data;
};

// 🌐 Obter fatura pública via token (sem login)
export const getInvoiceByToken = async (token: string): Promise<Invoice> => {
  const response = await api.get(`/invoices/share/${token}`);
  return response.data;
};

// 🔗 Gerar link público correto (PRODUÇÃO)
export const getInvoicePublicLink = (token: string): string => {
  const base =
    import.meta.env.VITE_API_URL?.replace(/\/api$/, "") ||
    "https://api.mecpro.tec.br/api";
  return `${base}/api/public/invoices/share/${token}`;
};