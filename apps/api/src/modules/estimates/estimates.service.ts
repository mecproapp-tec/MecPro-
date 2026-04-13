// apps/api/src/modules/estimates/estimates.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { EstimatesPdfService } from './estimates-pdf.service';
import { StorageService } from '../storage/storage.service';
import { randomBytes } from 'crypto';

@Injectable()
export class EstimatesService {
  private readonly logger = new Logger(EstimatesService.name);

  constructor(
    private prisma: PrismaService,
    private estimatesPdfService: EstimatesPdfService,
    private storageService: StorageService,
  ) {}

  private calculate(items: any[]) {
    let total = 0;
    const normalized = items.map((item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      const issPercent = Number(item.issPercent) || 0;

      const subtotal = price * quantity;
      const tax = subtotal * (issPercent / 100);
      const itemTotal = subtotal + tax;

      total += itemTotal;

      return {
        description: item.description || '-',
        quantity,
        price,
        issPercent,
        total: itemTotal,
      };
    });
    return { items: normalized, total };
  }

  async create(tenantId: string, data: any) {
    const { clientId, items: inputItems, date } = data;

    this.logger.log(`Criando orçamento para tenant: ${tenantId}, client: ${clientId}`);

    if (!tenantId) throw new BadRequestException('TenantId não informado');
    if (!clientId) throw new BadRequestException('Cliente não informado');
    if (!inputItems?.length) throw new BadRequestException('Orçamento sem itens');

    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });
    if (!client) throw new BadRequestException('Cliente não encontrado ou não pertence ao seu tenant');

    const { items, total } = this.calculate(inputItems);
    const estimateDate = date ? new Date(date) : new Date();

    try {
      const estimate = await this.prisma.estimate.create({
        data: {
          tenant: { connect: { id: tenantId } },
          client: { connect: { id: clientId } },
          total,
          status: 'DRAFT',
          date: estimateDate,
          items: { create: items },
        },
        include: { items: true, client: true, tenant: true },
      });

      this.logger.log(`Orçamento criado com ID: ${estimate.id}`);
      this.generatePdfInBackground(estimate).catch((err) => {
        this.logger.error(`Erro em background ao gerar PDF: ${err.message}`);
      });
      return estimate;
    } catch (error) {
      this.logger.error(`Erro ao criar orçamento: ${error.message}`, error.stack);
      if (error.code === 'P2003') throw new BadRequestException('Cliente ou Tenant inválido');
      throw new InternalServerErrorException('Erro interno ao criar orçamento');
    }
  }

  private async generatePdfInBackground(estimate: any) {
    try {
      const pdfBuffer = await this.estimatesPdfService.generateEstimatePdf(estimate);
      const pdfKey = `${estimate.tenantId}/estimates/${estimate.id}-${Date.now()}.pdf`;
      const pdfUrl = await this.storageService.uploadPdf(pdfBuffer, pdfKey);
      await this.prisma.estimate.update({
        where: { id: estimate.id },
        data: { pdfUrl, pdfKey, pdfStatus: 'generated', pdfGeneratedAt: new Date() },
      });
      this.logger.log(`PDF gerado para orçamento ${estimate.id}`);
    } catch (error) {
      this.logger.error(`Erro ao gerar PDF para orçamento ${estimate.id}: ${error.message}`);
      await this.prisma.estimate.update({ where: { id: estimate.id }, data: { pdfStatus: 'failed' } }).catch(e => this.logger.error(e.message));
    }
  }

  private async generatePdfAndWait(estimate: any, maxAttempts = 5, delay = 2000) {
    for (let i = 0; i < maxAttempts; i++) {
      if (estimate.pdfUrl) return;
      await this.generatePdfInBackground(estimate);
      await new Promise(resolve => setTimeout(resolve, delay));
      const updated = await this.prisma.estimate.findUnique({ where: { id: estimate.id } });
      if (updated?.pdfUrl) {
        estimate.pdfUrl = updated.pdfUrl;
        return;
      }
    }
    throw new Error('Falha ao gerar PDF após múltiplas tentativas');
  }

  // 🔥 MÉTODO COM PAGINAÇÃO
  async findAll(tenantId: string, page = 1, limit = 50) {
    if (!tenantId) throw new BadRequestException('TenantId inválido');
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.estimate.findMany({
        where: { tenantId },
        skip,
        take: limit,
        include: { client: true, items: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.estimate.count({ where: { tenantId } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, tenantId: string) {
    if (!tenantId) throw new BadRequestException('TenantId inválido');
    const estimate = await this.prisma.estimate.findFirst({
      where: { id, tenantId },
      include: { client: true, items: true, tenant: true },
    });
    if (!estimate) throw new NotFoundException('Orçamento não encontrado');
    return estimate;
  }

  async update(id: number, tenantId: string, data: any) {
    const estimate = await this.findOne(id, tenantId);
    if (!estimate) throw new NotFoundException('Orçamento não encontrado');

    const { clientId, items: inputItems, date, status } = data;
    
    const updateData: any = {};

    if (clientId !== undefined && clientId !== estimate.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: clientId, tenantId },
      });
      if (!client) throw new BadRequestException('Cliente não pertence ao tenant');
      updateData.clientId = clientId;
    }

    if (date) {
      updateData.date = new Date(date);
    }

    if (status) {
      updateData.status = status;
    }

    if (inputItems && inputItems.length > 0) {
      const { items, total } = this.calculate(inputItems);
      
      await this.prisma.estimateItem.deleteMany({
        where: { estimateId: id },
      });
      
      updateData.items = {
        create: items,
      };
      updateData.total = total;
    }

    if (Object.keys(updateData).length === 0) {
      return estimate;
    }

    const updatedEstimate = await this.prisma.estimate.update({
      where: { id },
      data: updateData,
      include: { client: true, items: true },
    });

    return updatedEstimate;
  }

  async convertToInvoice(estimateId: number, tenantId: string) {
    const estimate = await this.findOne(estimateId, tenantId);
    if (estimate.status === 'CONVERTED') {
      throw new BadRequestException('Orçamento já foi convertido');
    }

    return this.prisma.$transaction(async (tx) => {
      const lastInvoice = await tx.invoice.findFirst({
        where: { tenantId },
        orderBy: { id: 'desc' },
      });
      const nextNumber = lastInvoice ? Number(lastInvoice.number) + 1 : 1;
      const invoiceNumber = nextNumber.toString().padStart(6, '0');

      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          clientId: estimate.clientId,
          total: estimate.total,
          status: 'PENDING',
          number: invoiceNumber,
          estimateId: estimate.id,
          items: {
            create: estimate.items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              issPercent: item.issPercent,
            })),
          },
        },
        include: { items: true, client: true },
      });

      await tx.estimate.update({
        where: { id: estimateId },
        data: { status: 'CONVERTED' },
      });

      return invoice;
    });
  }

  async remove(id: number, tenantId: string) {
    const estimate = await this.findOne(id, tenantId);
    if (estimate.pdfKey) {
      await this.storageService.deleteFile(estimate.pdfKey).catch((err) => {
        this.logger.warn(`Erro ao deletar PDF no storage: ${err.message}`);
      });
    }
    await this.prisma.estimate.delete({ where: { id } });
    return { success: true };
  }

  async generateShareLink(estimateId: number, tenantId: string): Promise<string> {
    const estimate = await this.findOne(estimateId, tenantId);
    
    const existingShare = await this.prisma.publicShare.findFirst({
      where: {
        resourceId: estimateId,
        type: 'ESTIMATE',
        tenantId,
        expiresAt: { gt: new Date() },
      },
    });

    let token: string;
    
    if (existingShare) {
      token = existingShare.token;
    } else {
      const newShare = await this.prisma.publicShare.create({
        data: {
          token: randomBytes(32).toString('hex'),
          type: 'ESTIMATE',
          resourceId: estimateId,
          tenantId: estimate.tenantId,
          expiresAt: new Date(Date.now() + 7 * 86400000),
        },
      });
      token = newShare.token;
    }
    
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
    const fullUrl = `${cleanBaseUrl}/api/public/estimates/share/${token}`;
    
    this.logger.log(`Link compartilhável gerado: ${fullUrl}`);
    return fullUrl;
  }

  // 🔥 WhatsApp com espera do PDF e número opcional
  async sendToWhatsApp(id: number, tenantId: string, phoneNumber: string) {
    let estimate = await this.findOne(id, tenantId);
    
    // Garante que o PDF exista antes de enviar
    if (!estimate.pdfUrl) {
      await this.generatePdfAndWait(estimate);
      estimate = await this.findOne(id, tenantId);
    }
    
    if (!estimate.pdfUrl) {
      throw new BadRequestException('PDF ainda não disponível. Tente novamente em alguns instantes.');
    }
    
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const message = `📄 *ORÇAMENTO MECPRO #${estimate.id}*\n\n` +
                    `👤 *Cliente:* ${estimate.client?.name || '-'}\n` +
                    `🚗 *Veículo:* ${estimate.client?.vehicle || '-'}\n` +
                    `💰 *Total:* R$ ${Number(estimate.total).toFixed(2)}\n\n` +
                    `📎 *PDF:*\n${estimate.pdfUrl}\n\n` +
                    `MecPro - Sua oficina de confiança`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
    return { success: true, whatsappUrl };
  }

  async resendPdf(id: number, tenantId: string) {
    const estimate = await this.findOne(id, tenantId);
    const pdfBuffer = await this.estimatesPdfService.generateEstimatePdf(estimate);
    const pdfKey = `${estimate.tenantId}/estimates/${estimate.id}-${Date.now()}.pdf`;
    const pdfUrl = await this.storageService.uploadPdf(pdfBuffer, pdfKey);
    await this.prisma.estimate.update({ where: { id }, data: { pdfUrl, pdfKey, pdfGeneratedAt: new Date() } });
    return { success: true, pdfUrl };
  }
}