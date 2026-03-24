import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TenantStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const totalTenants = await this.prisma.tenant.count();
    const activeTenants = await this.prisma.tenant.count({ where: { status: 'ACTIVE' } });
    const blockedTenants = await this.prisma.tenant.count({ where: { status: 'BLOCKED' } });
    const totalClients = await this.prisma.client.count();
    const totalEstimates = await this.prisma.estimate.count();
    const totalInvoices = await this.prisma.invoice.count();

    const recentTenants = await this.prisma.tenant.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        status: true,
      },
    });

    return {
      totalTenants,
      activeTenants,
      blockedTenants,
      totalClients,
      totalEstimates,
      totalInvoices,
      recentTenants,
    };
  }

  // ✅ NOVO MÉTODO: listar todas as faturas (com filtros)
  async getAllInvoices(query: { tenantId?: string; status?: string; startDate?: string; endDate?: string }) {
    const where: any = {};
    if (query.tenantId) where.tenantId = query.tenantId;
    if (query.status) where.status = query.status;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        client: true,
        tenant: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map(inv => ({
      id: inv.id,
      number: inv.number,
      total: inv.total,
      status: inv.status,
      createdAt: inv.createdAt,
      clientName: inv.client?.name || 'N/A',
      tenantName: inv.tenant?.name || 'N/A',
      items: inv.items,
    }));
  }

  async getTenants(query: { search?: string; status?: string }) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { documentNumber: { contains: query.search } },
      ];
    }
    if (query.status) {
      where.status = query.status;
    }
    return this.prisma.tenant.findMany({
      where,
      include: {
        users: true,
        _count: { select: { clients: true, estimates: true, invoices: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: true,
        clients: true,
        estimates: true,
        invoices: true,
        notifications: true,
      },
    });
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    return tenant;
  }

  async updateTenantStatus(id: string, status: TenantStatus) {
    return this.prisma.tenant.update({
      where: { id },
      data: { status },
    });
  }

  async deleteTenant(id: string) {
    return this.prisma.tenant.delete({ where: { id } });
  }

  async getFinancialSummary(query: { month?: string; year?: string }) {
    const year = query.year ? parseInt(query.year) : new Date().getFullYear();
    const month = query.month ? parseInt(query.month) - 1 : null;

    const startDate = month !== null
      ? new Date(year, month, 1)
      : new Date(year, 0, 1);
    const endDate = month !== null
      ? new Date(year, month + 1, 0, 23, 59, 59)
      : new Date(year + 1, 0, 0, 23, 59, 59);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'PAID',
      },
    });

    const totalRevenue = invoices.reduce((acc, inv) => acc + inv.total, 0);
    const totalInvoices = invoices.length;

    return { totalRevenue, totalInvoices, period: { year, month: month !== null ? month + 1 : null } };
  }

  async sendNotification(body: { message: string; title: string; target: 'all' | 'specific'; tenantIds?: string[] }) {
    const { message, title, target, tenantIds } = body;
    let tenants: any[] = [];

    if (target === 'all') {
      tenants = await this.prisma.tenant.findMany({ select: { id: true } });
    } else if (target === 'specific' && tenantIds?.length) {
      tenants = tenantIds.map(id => ({ id }));
    } else {
      throw new BadRequestException('Destinatários inválidos');
    }

    const notifications = tenants.map(t => ({
      tenantId: t.id,
      title,
      message,
      isGlobal: target === 'all',
      read: false,
    }));

    await this.prisma.notification.createMany({ data: notifications });
    return { success: true, count: notifications.length };
  }

  async scheduleNotification(body: { message: string; title: string; schedule: Date; target: 'all' | 'specific'; tenantIds?: string[] }) {
    // Lógica para agendamento (pode ser implementada posteriormente)
    console.log('Notificação agendada:', body);
    return { success: true, message: 'Notificação agendada (simulação)' };
  }
}