import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { EstimateStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { EstimatesPdfService } from './estimates-pdf.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class EstimatesService {
  private readonly logger = new Logger(EstimatesService.name);

  constructor(
    private prisma: PrismaService,
    private estimatesPdfService: EstimatesPdfService,
    private whatsappService: WhatsappService,
    private configService: ConfigService,
    private storageService: StorageService,
  ) {}

  async create(
    tenantId: string,
    data: { clientId: number; date: string; items: any[] },
  ) {
    const client = await this.prisma.client.findFirst({
      where: { id: data.clientId, tenantId },
    });

    if (!client) throw new NotFoundException('Cliente não encontrado');

    if (!data.items || data.items.length === 0) {
      throw new BadRequestException(
        'Orçamento deve ter pelo menos um item.',
      );
    }

    const total = data.items.reduce((acc, item) => {
      const itemTotal = item.price * (item.quantity || 1);
      const iss = item.issPercent
        ? itemTotal * (item.issPercent / 100)
        : 0;
      return acc + itemTotal + iss;
    }, 0);

    return this.prisma.estimate.create({
      data: {
        tenantId,
        clientId: data.clientId,
        date: new Date(data.date),
        total,
        status: EstimateStatus.DRAFT,
        items: {
          create: data.items.map((item) => ({
            description: item.description,
            quantity: item.quantity || 1,
            price: item.price,
            total: item.price * (item.quantity || 1),
            issPercent: item.issPercent,
          })),
        },
      },
      include: { items: true, client: true },
    });
  }

  async findAll(tenantId: string, userRole?: string) {
    const where: any = {};

    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      where.tenantId = tenantId;
    }

    return this.prisma.estimate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        items: true,
      },
    });
  }

  async findOne(id: number, tenantId: string, userRole?: string) {
    const where: any = { id };

    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      where.tenantId = tenantId;
    }

    const estimate = await this.prisma.estimate.findFirst({
      where,
      include: {
        client: true,
        items: true,
      },
    });

    if (!estimate)
      throw new NotFoundException('Orçamento não encontrado');

    return estimate;
  }

  async update(
    id: number,
    tenantId: string,
    data: {
      clientId: number;
      date: string;
      items: any[];
      status?: string;
    },
    userRole?: string,
  ) {
    await this.findOne(id, tenantId, userRole);

    await this.prisma.estimateItem.deleteMany({
      where: { estimateId: id },
    });

    const total = data.items.reduce((acc, item) => {
      const itemTotal = item.price * (item.quantity || 1);
      const iss = item.issPercent
        ? itemTotal * (item.issPercent / 100)
        : 0;
      return acc + itemTotal + iss;
    }, 0);

    let status: EstimateStatus | undefined;

    if (data.status) {
      const map: any = {
        pending: EstimateStatus.DRAFT,
        accepted: EstimateStatus.APPROVED,
        converted: EstimateStatus.CONVERTED,
        DRAFT: EstimateStatus.DRAFT,
        APPROVED: EstimateStatus.APPROVED,
        CONVERTED: EstimateStatus.CONVERTED,
      };

      status = map[data.status];

      if (!status) {
        throw new BadRequestException(
          `Status inválido: ${data.status}`,
        );
      }
    }

    return this.prisma.estimate.update({
      where: { id },
      data: {
        clientId: data.clientId,
        date: new Date(data.date),
        total,
        status,
        items: {
          create: data.items.map((item) => ({
            description: item.description,
            quantity: item.quantity || 1,
            price: item.price,
            total: item.price * (item.quantity || 1),
            issPercent: item.issPercent,
          })),
        },
      },
      include: { items: true, client: true },
    });
  }

  async remove(id: number, tenantId: string, userRole?: string) {
    await this.findOne(id, tenantId, userRole);

    await this.prisma.estimateItem.deleteMany({
      where: { estimateId: id },
    });

    await this.prisma.estimate.delete({ where: { id } });

    return { message: 'Orçamento removido com sucesso' };
  }

  async generateShareToken(
    id: number,
    tenantId: string,
    userRole?: string,
  ): Promise<string> {
    await this.findOne(id, tenantId, userRole);

    const token = randomBytes(32).toString('hex');

    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    await this.prisma.estimate.update({
      where: { id },
      data: {
        shareToken: token,
        shareTokenExpires: expires,
      },
    });

    return token;
  }

  async validateShareToken(token: string) {
    const estimate = await this.prisma.estimate.findFirst({
      where: { shareToken: token },
      include: { client: true, items: true },
    });

    if (!estimate)
      throw new UnauthorizedException('Token inválido');

    if (
      estimate.shareTokenExpires &&
      new Date() > estimate.shareTokenExpires
    ) {
      throw new UnauthorizedException('Token expirado');
    }

    return estimate;
  }

  async getPdfByShareToken(token: string) {
    const estimate = await this.validateShareToken(token);

    if (estimate.pdfUrl) {
      try {
        const buffer = await this.storageService.get(
          estimate.pdfUrl,
        );
        return { pdfUrl: estimate.pdfUrl, pdfBuffer: buffer };
      } catch {
        this.logger.warn('Erro ao buscar PDF, regenerando...');
      }
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: estimate.tenantId },
    });

    const pdfBuffer =
      await this.estimatesPdfService.generateEstimatePdf(
        estimate,
        tenant,
      );

    const key = `${estimate.tenantId}/estimates/${estimate.id}.pdf`;

    const pdfUrl = await this.storageService.upload(
      pdfBuffer,
      key,
    );

    await this.prisma.estimate.update({
      where: { id: estimate.id },
      data: {
        pdfUrl,
        pdfStatus: 'generated',
        pdfGeneratedAt: new Date(),
      },
    });

    return { pdfUrl, pdfBuffer };
  }

  async sendViaWhatsApp(
    id: number,
    tenantId: string,
    workshopData?: any,
    userRole?: string,
  ) {
    const estimate = await this.prisma.estimate.findFirst({
      where: { id, tenantId },
      include: { client: true, items: true, tenant: true },
    });

    if (!estimate)
      throw new NotFoundException('Orçamento não encontrado');

    const client = estimate.client;

    if (!client.phone) {
      throw new BadRequestException(
        'Cliente não possui telefone',
      );
    }

    let token = estimate.shareToken;

    if (
      !token ||
      (estimate.shareTokenExpires &&
        new Date() > estimate.shareTokenExpires)
    ) {
      token = await this.generateShareToken(id, tenantId);
    }

    const baseUrl = (
      process.env.API_URL ||
      process.env.APP_URL ||
      ''
    )
      .replace(/\/api$/, '')
      .replace(/\/$/, '');

    if (!baseUrl) {
      throw new Error('API_URL não configurada');
    }

    const publicUrl = `${baseUrl}/api/public/estimates/share/${token}`;

    let pdfUrl = estimate.pdfUrl;

    if (!pdfUrl || estimate.pdfStatus !== 'generated') {
      this.logger.log(`Gerando PDF ${id}`);

      const pdfBuffer =
        await this.estimatesPdfService.generateEstimatePdf(
          estimate,
          estimate.tenant,
        );

      const key = `${tenantId}/estimates/${id}.pdf`;

      pdfUrl = await this.storageService.upload(
        pdfBuffer,
        key,
      );

      await this.prisma.estimate.update({
        where: { id },
        data: {
          pdfUrl,
          pdfStatus: 'generated',
          pdfGeneratedAt: new Date(),
        },
      });
    }

    const message = this.buildWhatsAppMessage(
      estimate,
      publicUrl,
    );

    const link =
      this.whatsappService.generateWhatsAppLink(
        client.phone,
        message,
      );

    return { whatsappLink: link, pdfUrl };
  }

  private buildWhatsAppMessage(
    estimate: any,
    url: string,
  ): string {
    return `Olá ${estimate.client.name}!

Seu orçamento está pronto ✅

${url}

🚗 Veículo: ${estimate.client.vehicle || 'Não informado'}
💰 Total: R$ ${estimate.total.toFixed(2)}
📌 Status: ${
      estimate.status === 'DRAFT'
        ? 'Pendente'
        : estimate.status === 'APPROVED'
        ? 'Aceito'
        : 'Convertido'
    }`;
  }
}