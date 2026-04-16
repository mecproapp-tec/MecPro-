import api from "./api";

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  price: number;
  total?: number;
  issPercent?: number;
}

export interface Invoice {
  id: number;
  clientId: number;
  number: string;
  total: number;
  status: "PENDING" | "PAID" | "CANCELED";
  createdAt: string;
  updatedAt?: string;
  pdfUrl?: string;
  pdfStatus?: string;
  pdfGeneratedAt?: string;
  shareToken?: string;
  shareTokenExpires?: string;
  items: InvoiceItem[];
  client?: {
    id: number;
    name: string;
    phone?: string;
    vehicle?: string;
    plate?: string;
    address?: string;
    document?: string;
  };
}

export interface CreateInvoiceData {
  clientId: number;
  items: Omit<InvoiceItem, "id" | "total">[];
  status?: "PENDING" | "PAID" | "CANCELED";
}

function extractObject(data: any): any {
  return data?.data || data;
}

export const getInvoices = async (): Promise<Invoice[]> => {
  const response = await api.get("/invoices");
  if (Array.isArray(response.data)) return response.data;
  if (response.data?.data && Array.isArray(response.data.data)) return response.data.data;
  if (response.data?.invoices && Array.isArray(response.data.invoices)) return response.data.invoices;
  return [];
};

export const getInvoiceById = async (id: number): Promise<Invoice> => {
  const response = await api.get(`/invoices/${id}`);
  return extractObject(response.data);
};

export const createInvoice = async (data: CreateInvoiceData): Promise<Invoice> => {
  const response = await api.post("/invoices", data);
  return extractObject(response.data);
};

export const updateInvoice = async (id: number, data: Partial<CreateInvoiceData>): Promise<Invoice> => {
  const response = await api.put(`/invoices/${id}`, data);
  return extractObject(response.data);
};

export const deleteInvoice = async (id: number): Promise<void> => {
  await api.delete(`/invoices/${id}`);
};

export function calculateTotalWithIss(items: InvoiceItem[]): number {
  return items.reduce((acc, item) => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    const iss = item.issPercent ? itemTotal * (item.issPercent / 100) : 0;
    return acc + itemTotal + iss;
  }, 0);
}

export const shareInvoice = async (id: number): Promise<{ shareUrl: string }> => {
  try {
    const response = await api.post(`/invoices/${id}/share`);
    return extractObject(response.data);
  } catch (error: any) {
    if (error.response?.status === 404) {
      const response = await api.get(`/invoices/${id}/share`);
      return extractObject(response.data);
    }
    throw error;
  }
};

export const sendInvoiceWhatsApp = async (id: number, phoneNumber?: string) => {
  const response = await api.post(`/invoices/${id}/send-whatsapp`, { phoneNumber });
  return extractObject(response.data);
};