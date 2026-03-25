import api from "./api";

export interface Client {
  id: number;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientData {
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleColor?: string;
}

export const getClients = async (): Promise<Client[]> => {
  const response = await api.get("/clients");
  return response.data;
};

export const getClientById = async (id: number): Promise<Client> => {
  const response = await api.get(`/clients/${id}`);
  return response.data;
};

export const createClient = async (data: CreateClientData): Promise<Client> => {
  const response = await api.post("/clients", data);
  return response.data;
};

export const updateClient = async (id: number, data: CreateClientData): Promise<Client> => {
  const response = await api.put(`/clients/${id}`, data);
  return response.data;
};

export const deleteClient = async (id: number): Promise<void> => {
  await api.delete(`/clients/${id}`);
};

export const getVehicleDisplay = (client: Client): string => {
  if (client.vehicleBrand && client.vehicleModel) {
    const year = client.vehicleYear ? ` ${client.vehicleYear}` : "";
    const color = client.vehicleColor ? ` - ${client.vehicleColor}` : "";
    return `${client.vehicleBrand} ${client.vehicleModel}${year}${color}`.trim();
  }
  return client.vehicle || "Não informado";
};