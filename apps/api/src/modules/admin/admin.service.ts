import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TenantStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    try {
      const [
        totalTenants,
        activeTenants,
        blockedTenants,
        totalClients,
        totalEstimates,
        totalInvoices,
        recentTenants,
      ] = await Promise.all([
        this.prisma.tenant.count(),
        this.prisma.tenant.count({ where: { status: 'ACTIVE' } }),
        this.prisma.tenant.count({ where: { status: 'BLOCKED' } }),
        this.prisma.client.count(),
        this.prisma.estimate.count(),
        this.prisma.invoice.count(),
        this.prisma.tenant.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            status: true,
          },
        }),
      ]);

      return {
        totalTenants,
        activeTenants,
        blockedTenants,
        totalClients,
        totalEstimates,
        totalInvoices,
        recentTenants,
      };
    } catch (error) {
      this.logger.error(`Erro ao carregar dashboard: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTenants(query: { search?: string; status?: string }) {
    try {
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

      return await this.prisma.tenant.findMany({
        where,
        include: {
          users: true,
          _count: { select: { clients: true, estimates: true, invoices: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Erro ao listar tenants: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTenant(id: string) {
    try {
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
    } catch (error) {
      this.logger.error(`Erro ao buscar tenant ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateTenantStatus(id: string, status: TenantStatus) {
    try {
      return await this.prisma.tenant.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      this.logger.error(`Erro ao atualizar status do tenant ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteTenant(id: string) {
    try {
      return await this.prisma.tenant.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Erro ao excluir tenant ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getFinancialSummary(query: { month?: string; year?: string }) {
    try {
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
    } catch (error) {
      this.logger.error(`Erro ao obter resumo financeiro: ${error.message}`, error.stack);
      throw error;
    }
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
    this.logger.log(`Notificação agendada: ${JSON.stringify(body)}`);
    return { success: true, message: 'Notificação agendada (simulação)' };
  }

  // ===== MÉTODOS PARA PDF (pdfkit) =====

  async getInvoiceById(id: number) {
    this.logger.log(`Buscando fatura ID: ${id}`);
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        tenant: true,
        items: true,
      },
    });
    if (!invoice) throw new NotFoundException('Fatura não encontrada');
    this.logger.log(`Fatura encontrada: ${invoice.id}, cliente: ${invoice.client?.name}, tenant: ${invoice.tenant?.name}`);
    return invoice;
  }

  async generateInvoicePdf(invoice: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Cabeçalho
        doc.fontSize(18).text(`Fatura ${invoice.number}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Cliente: ${invoice.client?.name || 'Cliente não informado'}`);
        doc.text(`Tenant: ${invoice.tenant?.name || 'Tenant não informado'}`);
        doc.moveDown();

        // Tabela
        const startX = doc.x;
        const startY = doc.y;
        const columnWidth = [250, 100, 100];
        const columns = ['Descrição', 'Quantidade', 'Valor'];

        doc.font('Helvetica-Bold');
        doc.text(columns[0], startX, startY);
        doc.text(columns[1], startX + columnWidth[0], startY, { width: columnWidth[1], align: 'center' });
        doc.text(columns[2], startX + columnWidth[0] + columnWidth[1], startY, { width: columnWidth[2], align: 'right' });
        doc.font('Helvetica');

        let y = startY + 20;
        const items = Array.isArray(invoice.items) ? invoice.items : [];
        for (const item of items) {
          const desc = item.description || item.name || 'Item';
          const qty = item.quantity ?? 1;
          const price = item.price ?? 0;
          const totalItem = price * qty;

          doc.text(desc, startX, y);
          doc.text(qty.toString(), startX + columnWidth[0], y, { width: columnWidth[1], align: 'center' });
          doc.text(`R$ ${totalItem.toFixed(2)}`, startX + columnWidth[0] + columnWidth[1], y, { width: columnWidth[2], align: 'right' });
          y += 20;
        }

        y += 10;
        doc.font('Helvetica-Bold');
        doc.text('Total', startX + columnWidth[0] + columnWidth[1], y, { width: columnWidth[2], align: 'right' });
        doc.text(`R$ ${(invoice.total ?? 0).toFixed(2)}`, startX + columnWidth[0] + columnWidth[1] + columnWidth[2] - 50, y, { width: 50, align: 'right' });
        doc.font('Helvetica');

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async getEstimateById(id: number) {
    this.logger.log(`Buscando orçamento ID: ${id}`);
    const estimate = await this.prisma.estimate.findUnique({
      where: { id },
      include: {
        client: true,
        tenant: true,
        items: true,
      },
    });
    if (!estimate) throw new NotFoundException('Orçamento não encontrado');
    this.logger.log(`Orçamento encontrado: ${estimate.id}, cliente: ${estimate.client?.name}, tenant: ${estimate.tenant?.name}`);
    return estimate;
  }

  async generateEstimatePdf(estimate: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Cabeçalho
        doc.fontSize(18).text(`Orçamento #${estimate.id}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Cliente: ${estimate.client?.name || 'Cliente não informado'}`);
        doc.text(`Tenant: ${estimate.tenant?.name || 'Tenant não informado'}`);
        doc.moveDown();

        // Tabela
        const startX = doc.x;
        const startY = doc.y;
        const columnWidth = [250, 100, 100];
        const columns = ['Descrição', 'Quantidade', 'Valor'];

        doc.font('Helvetica-Bold');
        doc.text(columns[0], startX, startY);
        doc.text(columns[1], startX + columnWidth[0], startY, { width: columnWidth[1], align: 'center' });
        doc.text(columns[2], startX + columnWidth[0] + columnWidth[1], startY, { width: columnWidth[2], align: 'right' });
        doc.font('Helvetica');

        let y = startY + 20;
        const items = Array.isArray(estimate.items) ? estimate.items : [];
        for (const item of items) {
          const desc = item.description || item.name || 'Item';
          const qty = item.quantity ?? 1;
          const price = item.price ?? 0;
          const totalItem = price * qty;

          doc.text(desc, startX, y);
          doc.text(qty.toString(), startX + columnWidth[0], y, { width: columnWidth[1], align: 'center' });
          doc.text(`R$ ${totalItem.toFixed(2)}`, startX + columnWidth[0] + columnWidth[1], y, { width: columnWidth[2], align: 'right' });
          y += 20;
        }

        y += 10;
        doc.font('Helvetica-Bold');
        doc.text('Total', startX + columnWidth[0] + columnWidth[1], y, { width: columnWidth[2], align: 'right' });
        doc.text(`R$ ${(estimate.total ?? 0).toFixed(2)}`, startX + columnWidth[0] + columnWidth[1] + columnWidth[2] - 50, y, { width: 50, align: 'right' });
        doc.font('Helvetica');

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // ===== MÉTODOS PARA CLIENTES, ORÇAMENTOS E FATURAS (listagem) =====

  async getAllInvoices(query: { tenantId?: string; status?: string; startDate?: string; endDate?: string }) {
    try {
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
        include: { client: true, tenant: true, items: true },
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
    } catch (error) {
      this.logger.error(`Erro ao listar faturas: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAllClients(query: { search?: string; tenantId?: string }) {
    try {
      const where: any = {};
      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { vehicle: { contains: query.search, mode: 'insensitive' } },
          { plate: { contains: query.search, mode: 'insensitive' } },
        ];
      }
      if (query.tenantId) where.tenantId = query.tenantId;

      const clients = await this.prisma.client.findMany({
        where,
        include: { tenant: true },
        orderBy: { createdAt: 'desc' },
      });

      return clients.map(client => ({
        id: client.id,
        name: client.name,
        phone: client.phone,
        vehicle: client.vehicle,
        plate: client.plate,
        tenantId: client.tenantId,
        tenantName: client.tenant?.name,
      }));
    } catch (error) {
      this.logger.error(`Erro ao listar clientes: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getClientById(id: string) {
    const clientId = Number(id);
    if (isNaN(clientId)) {
      throw new BadRequestException('ID de cliente inválido');
    }
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { tenant: true },
    });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return client;
  }

  async getAllEstimates(query: { status?: string; tenantId?: string }) {
    try {
      const where: any = {};
      if (query.status) where.status = query.status;
      if (query.tenantId) where.tenantId = query.tenantId;

      const estimates = await this.prisma.estimate.findMany({
        where,
        include: { client: true, tenant: true },
        orderBy: { date: 'desc' },
      });

      return estimates.map(est => ({
        id: est.id,
        clientId: est.clientId,
        clientName: est.client?.name,
        date: est.date,
        total: est.total,
        status: est.status,
        tenantId: est.tenantId,
        tenantName: est.tenant?.name,
      }));
    } catch (error) {
      this.logger.error(`Erro ao listar orçamentos: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ===== MÉTODOS PARA NOTIFICAÇÕES (ADMIN) =====

  async getNotifications() {
    try {
      return await this.prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        include: { tenant: true },
      });
    } catch (error) {
      this.logger.error(`Erro ao listar notificações: ${error.message}`, error.stack);
      throw error;
    }
  }

  async markAsRead(id: string) {
    try {
      const notificationId = Number(id);
      if (isNaN(notificationId)) {
        throw new BadRequestException('ID inválido');
      }
      return await this.prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
      });
    } catch (error) {
      this.logger.error(`Erro ao marcar notificação ${id} como lida: ${error.message}`, error.stack);
      throw error;
    }
  }

  async markAllAsRead() {
    try {
      return await this.prisma.notification.updateMany({
        where: { read: false },
        data: { read: true },
      });
    } catch (error) {
      this.logger.error(`Erro ao marcar todas as notificações como lidas: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteNotification(id: number) {
    try {
      const notification = await this.prisma.notification.findUnique({ where: { id } });
      if (!notification) throw new NotFoundException('Notificação não encontrada');
      return await this.prisma.notification.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Erro ao excluir notificação ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
