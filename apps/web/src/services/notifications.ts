import api from "./api";

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  appointmentId?: number;
}

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get("/notifications");
  if (Array.isArray(response.data)) return response.data;
  if (response.data?.data && Array.isArray(response.data.data)) return response.data.data;
  if (response.data?.notifications && Array.isArray(response.data.notifications)) return response.data.notifications;
  return [];
};

export const markAsRead = async (id: number): Promise<void> => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await api.patch("/notifications/read-all");
};