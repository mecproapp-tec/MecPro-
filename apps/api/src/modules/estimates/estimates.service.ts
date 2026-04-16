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
import { Prisma } from '@prisma/client';
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
    let total = new Prisma.Decimal(0);
    const normalized = items.map((item) => {
      const price = new Prisma.Decimal(item.price || 0);
      const quantity = new Prisma.Decimal(item.quantity || 1);
      const issPercent = new Prisma.Decimal(item.issPercent || 0);
      const subtotal = price.times(quantity);
      const tax = subtotal.times(issPercent).dividedBy(100);
      const itemTotal = subtotal.plus(tax);
      total = total.plus(itemTotal);
      return {
        description: item.description || '-',
        quantity: quantity.toNumber(),
        price,
        issPercent: issPercent.toNumber(),
        total: itemTotal,
      };
    });
    return { items: normalized, total };
  }

  async create(tenantId: string, data: any) {
    const { clientId, items: inputItems, date } = data;

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
          tenantId,
          clientId,
          total,
          status: 'DRAFT',
          date: estimateDate,
          items: { create: items },
        },
        include: { items: true, client: true, tenant: true },
      });

      this.logger.log(`Orçamento criado com ID: ${estimate.id}`);
      return estimate;
    } catch (error) {
      this.logger.error(`Erro ao criar orçamento: ${error.message}`, error.stack);
      if (error.code === 'P2003') throw new BadRequestException('Cliente ou Tenant inválido');
      throw new InternalServerErrorException('Erro interno ao criar orçamento');
    }
  }

  private async generatePdfNow(estimate: any) {
    try {
      const pdfBuffer = await this.estimatesPdfService.generateEstimatePdf(estimate);
      const pdfKey = `${estimate.tenantId}/estimates/${estimate.id}.pdf`;
      const pdfUrl = await this.storageService.uploadPdf(pdfBuffer, pdfKey);
      await this.prisma.estimate.update({
        where: { id: estimate.id },
        data: {
          pdfUrl,
          pdfKey,
          pdfStatus: 'generated',
          pdfGeneratedAt: new Date(),
        },
      });
      this.logger.log(`PDF gerado para orçamento ${estimate.id}`);
      return { pdfUrl, pdfKey };
    } catch (error) {
      this.logger.error(`Erro ao gerar PDF para orçamento ${estimate.id}: ${error.message}`);
      await this.prisma.estimate.update({
        where: { id: estimate.id },
        data: { pdfStatus: 'failed' },
      }).catch(e => this.logger.error(e.message));
      throw new BadRequestException('Erro ao gerar PDF. Tente novamente mais tarde.');
    }
  }

  private async ensurePdf(estimateId: number) {
    const estimate = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
    });
    if (!estimate) throw new NotFoundException('Orçamento não encontrado');

    if (estimate.pdfUrl && estimate.pdfKey) {
      return { pdfUrl: estimate.pdfUrl, pdfKey: estimate.pdfKey };
    }

    const fullEstimate = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      include: { client: true, items: true, tenant: true },
    });
    return this.generatePdfNow(fullEstimate);
  }

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

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

    if (date) updateData.date = new Date(date);
    if (status) updateData.status = status;

    let itemsChanged = false;
    if (inputItems && inputItems.length > 0) {
      const { items, total } = this.calculate(inputItems);
      await this.prisma.estimateItem.deleteMany({ where: { estimateId: id } });
      updateData.items = { create: items };
      updateData.total = total;
      itemsChanged = true;
    }

    if (Object.keys(updateData).length === 0) return estimate;

    const updatedEstimate = await this.prisma.estimate.update({
      where: { id },
      data: updateData,
      include: { client: true, items: true },
    });

    if (itemsChanged) {
      await this.prisma.estimate.update({
        where: { id },
        data: { pdfUrl: null, pdfKey: null, pdfStatus: 'pending', pdfGeneratedAt: null },
      });
    }

    return updatedEstimate;
  }

  async convertToInvoice(estimateId: number, tenantId: string) {
    const estimate = await this.findOne(estimateId, tenantId);
    if (estimate.status === 'CONVERTED') throw new BadRequestException('Orçamento já foi convertido');

    try {
      return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        let invoiceNumber = `${timestamp}${random}`;

        const existing = await tx.invoice.findUnique({ where: { number: invoiceNumber } });
        if (existing) {
          invoiceNumber = `${timestamp}${random}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
        }

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

        this.logger.log(`✅ Orçamento ${estimateId} convertido para fatura ${invoice.number}`);
        return invoice;
      });
    } catch (error) {
      this.logger.error(`Erro na conversão: ${error.message}`);
      if (error.code === 'P2002') {
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.convertToInvoice(estimateId, tenantId);
      }
      throw error;
    }
  }

  async remove(id: number, tenantId: string) {
    const estimate = await this.findOne(id, tenantId);
    if (estimate.pdfKey) {
      await this.storageService.deleteFile(estimate.pdfKey).catch(() => {});
    }
    await this.prisma.estimate.delete({ where: { id } });
    return { success: true };
  }

  async generateShareLink(estimateId: number, tenantId: string): Promise<{ shareUrl: string }> {
    const estimate = await this.findOne(estimateId, tenantId);
    await this.ensurePdf(estimateId);

    const existingShare = await this.prisma.publicShare.findFirst({
      where: { resourceId: estimateId, type: 'ESTIMATE', tenantId, expiresAt: { gt: new Date() } },
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

    const baseUrl = process.env.API_URL || 'http://localhost:3000/api';
    const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
    const shareUrl = `${cleanBaseUrl}/public/estimates/share/${token}`;
    return { shareUrl };
  }

  async sendToWhatsApp(id: number, tenantId: string, phoneNumber: string) {
    const estimate = await this.findOne(id, tenantId);
    await this.ensurePdf(id);
    const { shareUrl } = await this.generateShareLink(id, tenantId);

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const message = `📄 *ORÇAMENTO MECPRO #${estimate.id}*\n👤 *Cliente:* ${estimate.client?.name || '-'}\n🚗 *Veículo:* ${estimate.client?.vehicle || '-'}\n💰 *Total:* R$ ${Number(estimate.total).toFixed(2)}\n🔗 *Link:* ${shareUrl}\nMecPro - Sua oficina de confiança`;
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    return { success: true, whatsappUrl };
  }

  async resendPdf(id: number, tenantId: string) {
    await this.ensurePdf(id);
    const estimate = await this.prisma.estimate.findUnique({ where: { id } });
    return { success: true, pdfUrl: estimate?.pdfUrl };
  }
}