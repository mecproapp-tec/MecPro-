import api from "./api";

export interface Appointment {
  id: number;
  clientId: number;
  date: string;
  comment?: string;
  client?: {
    name: string;
    plate?: string;
  };
}

export const getAppointments = async (): Promise<Appointment[]> => {
  try {
    const response = await api.get("/appointments");
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn("Rota /appointments não implementada. Retornando array vazio.");
      return [];
    }
    throw error;
  }
};

export const getAppointmentById = async (id: number): Promise<Appointment> => {
  const response = await api.get(`/appointments/${id}`);
  return response.data;
};

export const createAppointment = async (data: { clientId: number; date: string; comment?: string }): Promise<Appointment> => {
  const response = await api.post("/appointments", data);
  return response.data;
};

export const updateAppointment = async (id: number, data: { clientId: number; date: string; comment?: string }): Promise<Appointment> => {
  const response = await api.put(`/appointments/${id}`, data);
  return response.data;
};

export const deleteAppointment = async (id: number): Promise<void> => {
  await api.delete(`/appointments/${id}`);
};