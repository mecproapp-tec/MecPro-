import api from "./api";

export interface EstimateItem {
  description: string;
  price: number;
  issPercent?: number;
}

export interface Estimate {
  id: number;
  clientId: number;
  clientName?: string;
  plate?: string;
  date: string;
  total: number;
  status: "pending" | "accepted" | "converted";
  items: EstimateItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEstimateData {
  clientId: number;
  date: string;
  items: EstimateItem[];
  status?: string; // para update
}

// Mapeamento de status frontend -> backend
const statusToBackend = {
  pending: "DRAFT",
  accepted: "APPROVED",
  converted: "CONVERTED",
};

// Mapeamento backend -> frontend
const statusToFrontend = {
  DRAFT: "pending",
  APPROVED: "accepted",
  CONVERTED: "converted",
};

export const getEstimates = async (): Promise<Estimate[]> => {
  try {
    const response = await api.get("/estimates");
    return response.data.map((est: any) => ({
      ...est,
      status: statusToFrontend[est.status] || est.status,
    }));
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn("Rota /estimates não implementada. Retornando array vazio.");
      return [];
    }
    throw error;
  }
};

export const getEstimateById = async (id: number): Promise<Estimate> => {
  const response = await api.get(`/estimates/${id}`);
  const est = response.data;
  return {
    ...est,
    status: statusToFrontend[est.status] || est.status,
  };
};

export const createEstimate = async (data: CreateEstimateData): Promise<Estimate> => {
  const payload = { ...data, status: "DRAFT" };
  const response = await api.post("/estimates", payload);
  const est = response.data;
  return {
    ...est,
    status: statusToFrontend[est.status] || est.status,
  };
};

export const updateEstimate = async (id: number, data: CreateEstimateData): Promise<Estimate> => {
  // Converte status para o formato do backend
  const payload = {
    ...data,
    status: data.status ? statusToBackend[data.status] || data.status : undefined,
  };
  console.log("Enviando update com payload:", payload);
  const response = await api.put(`/estimates/${id}`, payload);
  console.log("Resposta do update:", response.data);
  const est = response.data;
  return {
    ...est,
    status: statusToFrontend[est.status] || est.status,
  };
};

export const deleteEstimate = async (id: number): Promise<void> => {
  await api.delete(`/estimates/${id}`);
};

export function calculateTotalWithIss(items: EstimateItem[]): number {
  return items.reduce((acc, item) => {
    const iss = item.issPercent ? item.price * (item.issPercent / 100) : 0;
    return acc + item.price + iss;
  }, 0);
}