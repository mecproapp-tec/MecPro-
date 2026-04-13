// apps/api/src/modules/invoices/invoices.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { InvoicesPdfService } from './invoices-pdf.service';
import { StorageService } from '../storage/storage.service';
import { InvoiceStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private prisma: PrismaService,
    private invoicesPdfService: InvoicesPdfService,
    private storageService: StorageService,
  ) {}

  private calculate(items: any[]) {
    let total = 0;
    const normalized = items.map((item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      const itemTotal = price * quantity;
      total += itemTotal;
      return {
        description: item.description || '-',
        quantity,
        price,
        total: itemTotal,
      };
    });
    return { items: normalized, total };
  }

  async create(tenantId: string, data: any) {
    const { clientId, items: inputItems } = data;
    if (!tenantId) throw new BadRequestException('TenantId não informado');
    if (!clientId) throw new BadRequestException('Cliente não informado');
    if (!inputItems?.length) throw new BadRequestException('Fatura sem itens');

    const client = await this.prisma.client.findFirst({ where: { id: clientId, tenantId } });
    if (!client) throw new BadRequestException('Cliente não encontrado');

    const { items, total } = this.calculate(inputItems);
    const invoiceNumber = `FAT-${Date.now()}`;

    const invoice = await this.prisma.invoice.create({
      data: {
        tenant: { connect: { id: tenantId } },
        client: { connect: { id: clientId } },
        number: invoiceNumber,
        total,
        status: 'PENDING',
        items: { create: items },
      },
      include: { items: true, client: true, tenant: true },
    });

    this.logger.log(`Fatura criada ID: ${invoice.id}`);
    this.generatePdfInBackground(invoice).catch(err => this.logger.error(err));
    return invoice;
  }

  private async generatePdfInBackground(invoice: any) {
    try {
      const pdfBuffer = await this.invoicesPdfService.generateInvoicePdf(invoice);
      const pdfKey = `${invoice.tenantId}/invoices/${invoice.id}-${Date.now()}.pdf`;
      const pdfUrl = await this.storageService.uploadPdf(pdfBuffer, pdfKey);
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { pdfUrl, pdfKey, pdfStatus: 'generated', pdfGeneratedAt: new Date() },
      });
      this.logger.log(`PDF gerado fatura ${invoice.id}`);
    } catch (error) {
      this.logger.error(`Erro PDF fatura ${invoice.id}: ${error.message}`);
      await this.prisma.invoice.update({ where: { id: invoice.id }, data: { pdfStatus: 'failed' } });
    }
  }

  private async generatePdfAndWait(invoice: any, maxAttempts = 5, delay = 2000) {
    for (let i = 0; i < maxAttempts; i++) {
      if (invoice.pdfUrl) return;
      await this.generatePdfInBackground(invoice);
      await new Promise(resolve => setTimeout(resolve, delay));
      const updated = await this.prisma.invoice.findUnique({ where: { id: invoice.id } });
      if (updated?.pdfUrl) {
        invoice.pdfUrl = updated.pdfUrl;
        return;
      }
    }
    throw new Error('Falha ao gerar PDF após múltiplas tentativas');
  }

  async findAll(tenantId: string, page = 1, limit = 50) {
    if (!tenantId) throw new BadRequestException('TenantId inválido');
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where: { tenantId },
        skip,
        take: limit,
        include: { client: true, items: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where: { tenantId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number, tenantId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: { client: true, items: true, tenant: true },
    });
    if (!invoice) throw new NotFoundException('Fatura não encontrada');
    return invoice;
  }

  async update(id: number, tenantId: string, data: any) {
    await this.findOne(id, tenantId);
    return this.prisma.invoice.update({
      where: { id },
      data: { clientId: data.clientId, status: data.status as InvoiceStatus },
      include: { client: true, items: true },
    });
  }

  async remove(id: number, tenantId: string) {
    const invoice = await this.findOne(id, tenantId);
    if (invoice.pdfKey) await this.storageService.deleteFile(invoice.pdfKey).catch(() => {});
    await this.prisma.invoice.delete({ where: { id } });
    return { success: true };
  }

  async generateShareLink(invoiceId: number, tenantId: string): Promise<string> {
    const invoice = await this.findOne(invoiceId, tenantId);
    const token = randomBytes(32).toString('hex');
    await this.prisma.publicShare.create({
      data: {
        token,
        type: 'INVOICE',
        resourceId: invoiceId,
        tenantId: invoice.tenantId,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    return `${baseUrl}/public/invoices/share/${token}`;
  }

  async sendToWhatsApp(id: number, tenantId: string, phoneNumber: string) {
    let invoice = await this.findOne(id, tenantId);
    if (!invoice.pdfUrl) {
      await this.generatePdfAndWait(invoice);
      invoice = await this.findOne(id, tenantId);
    }
    if (!invoice.pdfUrl) {
      throw new BadRequestException('PDF ainda não disponível. Tente novamente em alguns instantes.');
    }
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const message =
      `📄 *FATURA MECPRO #${invoice.number}*\n\n` +
      `👤 *Cliente:* ${invoice.client?.name || '-'}\n` +
      `🚗 *Veículo:* ${invoice.client?.vehicle || '-'}\n` +
      `💰 *Total:* R$ ${Number(invoice.total).toFixed(2)}\n` +
      `📅 *Data:* ${new Date(invoice.createdAt).toLocaleDateString('pt-BR')}\n\n` +
      `📎 *PDF:*\n${invoice.pdfUrl}\n\n` +
      `---\n` +
      `MecPro - Sua oficina de confiança`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
    this.logger.log(`WhatsApp link: ${whatsappUrl}`);
    return { success: true, whatsappUrl, message: 'Clique no link para enviar pelo WhatsApp' };
  }

  async resendPdf(id: number, tenantId: string) {
    const invoice = await this.findOne(id, tenantId);
    const pdfBuffer = await this.invoicesPdfService.generateInvoicePdf(invoice);
    const pdfKey = `${invoice.tenantId}/invoices/${invoice.id}-${Date.now()}.pdf`;
    const pdfUrl = await this.storageService.uploadPdf(pdfBuffer, pdfKey);
    await this.prisma.invoice.update({ where: { id }, data: { pdfUrl, pdfKey, pdfGeneratedAt: new Date() } });
    return { success: true, pdfUrl };
  }
}