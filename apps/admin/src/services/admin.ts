import api from './api';

export interface DashboardData {
  totalTenants: number;
  activeTenants: number;
  blockedTenants: number;
  totalClients: number;
  totalEstimates: number;
  totalInvoices: number;
  recentTenants: Array<{ id: string; name: string; email: string; createdAt: string; status: string }>;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  documentNumber: string;
  phone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  users: any[];
  clients?: any[];
  estimates?: any[];
  invoices?: any[];
  _count?: { clients: number; estimates: number; invoices: number };
}

// Novas interfaces para clientes, orçamentos e notificações do admin
export interface Client {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  tenantId: string;
  tenantName?: string;
}

export interface Estimate {
  id: string;
  clientId: string;
  clientName?: string;
  date: string;
  total: number;
  status: string;
  tenantId: string;
  tenantName?: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  target: string;
  tenantIds?: string[];
  sentAt: string;
  read: boolean;
}

export const getDashboard = async (): Promise<DashboardData> => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

export const getTenants = async (params?: { status?: string; search?: string }): Promise<Tenant[]> => {
  const response = await api.get('/admin/tenants', { params });
  return response.data;
};

export const getTenant = async (id: string): Promise<Tenant> => {
  const response = await api.get(`/admin/tenants/${id}`);
  return response.data;
};

export const getTenantClients = async (tenantId: string) => {
  const response = await api.get(`/admin/tenants/${tenantId}/clients`);
  return response.data;
};

export const getTenantEstimates = async (tenantId: string) => {
  const response = await api.get(`/admin/tenants/${tenantId}/estimates`);
  return response.data;
};

export const getTenantInvoices = async (tenantId: string) => {
  const response = await api.get(`/admin/tenants/${tenantId}/invoices`);
  return response.data;
};

export const updateTenantStatus = async (id: string, status: string) => {
  const response = await api.put(`/admin/tenants/${id}/status`, { status });
  return response.data;
};

export const deleteTenant = async (id: string) => {
  await api.delete(`/admin/tenants/${id}`);
};

export const getFinancialSummary = async (month?: number, year?: number) => {
  const params = new URLSearchParams();
  if (month !== undefined) params.append('month', month.toString());
  if (year !== undefined) params.append('year', year.toString());
  const response = await api.get('/admin/financial/summary', { params });
  return response.data;
};

export const sendNotification = async (data: { message: string; title: string; target: 'all' | 'specific'; tenantIds?: string[] }) => {
  const response = await api.post('/admin/notifications/send', data);
  return response.data;
};

export const scheduleNotification = async (data: { message: string; title: string; schedule: Date; target: 'all' | 'specific'; tenantIds?: string[] }) => {
  const response = await api.post('/admin/notifications/schedule', data);
  return response.data;
};

// ===== NOVAS FUNÇÕES PARA CLIENTES, ORÇAMENTOS E NOTIFICAÇÕES =====

export const getAllClients = async (params?: { search?: string; tenantId?: string }): Promise<Client[]> => {
  const response = await api.get('/admin/clients', { params });
  return response.data;
};

export const getAllEstimates = async (params?: { status?: string; tenantId?: string }): Promise<Estimate[]> => {
  const response = await api.get('/admin/estimates', { params });
  return response.data;
};

export const getNotifications = async (): Promise<AdminNotification[]> => {
  const response = await api.get('/admin/notifications');
  return response.data;
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  await api.put(`/admin/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.put('/admin/notifications/read-all');
};
