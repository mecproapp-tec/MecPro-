import api from "./api";

export interface UpdateTenantData {
  nome: string;
  documento: string;
  numero: string;
  endereco: string;
  telefone: string;
  email: string;
  logo?: string;
}

function extractObject(data: any) {
  return data?.data || data;
}

export async function updateTenant(data: UpdateTenantData): Promise<UpdateTenantData> {
  const response = await api.patch("/tenants/me", data);
  return extractObject(response.data);
}