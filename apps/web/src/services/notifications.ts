// apps/web/src/services/notifications.ts
import api from './api';

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await api.get('/notifications');
    // Garante que retorna um array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    console.warn('Resposta inesperada de notificações:', response.data);
    return [];
  } catch (error) {
    console.error('Erro ao carregar notificações', error);
    return [];
  }
};

export const markAsRead = async (id: number): Promise<void> => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await api.patch('/notifications/read-all');
};