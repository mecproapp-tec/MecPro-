// apps/web/src/services/Estimates.ts
import api from './api';

export interface EstimateItem {
  description: string;
  quantity?: number;
  price: number;
  issPercent?: number;
  total?: number;
}

export interface Estimate {
  id: number;
  clientId: number;
  client?: {
    id: number;
    name: string;
    phone?: string;
    vehicle?: string;
    plate?: string;
  };
  date: string;
  items: EstimateItem[];
  total: number;
  status: string; // 'pending' | 'accepted' | 'converted' no frontend
  createdAt?: string;
  updatedAt?: string;
}

export async function getEstimates(): Promise<Estimate[]> {
  const response = await api.get('/estimates');
  return response.data;
}

export async function getEstimateById(id: number): Promise<Estimate> {
  const response = await api.get(`/estimates/${id}`);
  return response.data;
}

export async function createEstimate(data: any): Promise<Estimate> {
  const response = await api.post('/estimates', data);
  return response.data;
}

export async function updateEstimate(id: number, data: any): Promise<Estimate> {
  const response = await api.patch(`/estimates/${id}`, data);
  return response.data;
}

export async function deleteEstimate(id: number): Promise<void> {
  await api.delete(`/estimates/${id}`);
}

export async function convertEstimate(id: number): Promise<any> {
  const response = await api.post(`/estimates/${id}/convert`);
  return response.data;
}