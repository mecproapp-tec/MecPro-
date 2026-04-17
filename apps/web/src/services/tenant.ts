// apps/web/src/services/tenant.ts
import api from "./api";

export interface UpdateTenantData {
  nome: string;
  tipoDocumento: string;
  documento: string;
  numero: string;
  endereco: string;
  telefone: string;
  email: string;
  logo?: string;
}

export interface TenantData {
  nome: string;
  tipoDocumento: string;
  documento: string;
  numero: string;
  endereco: string;
  telefone: string;
  email: string;
  logo?: string;
}

export async function getTenant(): Promise<TenantData> {
  const response = await api.get("/tenants/me");
  return response.data.data;
}

export async function updateTenant(data: UpdateTenantData): Promise<TenantData> {
  const response = await api.put("/tenants/me", data);
  return response.data.data;
}