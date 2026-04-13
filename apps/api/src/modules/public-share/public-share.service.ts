// apps/api/src/modules/public-share/public-share.service.ts
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class PublicShareService {
  constructor(private prisma: PrismaService) {}

  // =========================
  // CREATE SHARE (CORRIGIDO)
  // =========================
  async create({
    tenantId,
    type,
    resourceId,
    expiresInDays = 7,
  }: {
    tenantId: string;
    type: 'ESTIMATE' | 'INVOICE';
    resourceId: number;
    expiresInDays?: number;
  }) {
    const token = randomBytes(32).toString('hex');

    const expiresAt = new Date(Date.now() + expiresInDays * 86400000);

    return this.prisma.publicShare.create({
      data: {
        token,
        tenantId,
        type,
        resourceId,
        expiresAt,
        // pdfUrl é opcional no schema, pode ficar null
      },
    });
  }

  // =========================
  // FIND BY TOKEN (VALIDADO)
  // =========================
  async findByToken(token: string) {
    const share = await this.prisma.publicShare.findUnique({
      where: { token },
    });

    if (!share) {
      throw new NotFoundException('Link inválido ou expirado');
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new UnauthorizedException('Link expirado');
    }

    return share;
  }

  // =========================
  // GET FULL DATA (PDF + DADOS)
  // =========================
  async getPublicData(token: string) {
    const share = await this.findByToken(token);

    if (share.type === 'ESTIMATE') {
      const estimate = await this.prisma.estimate.findUnique({
        where: { id: share.resourceId },
        include: {
          client: true,
          items: true,
          tenant: true,
        },
      });

      if (!estimate) {
        throw new NotFoundException('Orçamento não encontrado');
      }

      // Buscar PDF do orçamento se existir
      let pdfUrl = share.pdfUrl;
      if (!pdfUrl && estimate.pdfUrl) {
        pdfUrl = estimate.pdfUrl;
      }

      return {
        type: 'ESTIMATE',
        pdfUrl,
        data: {
          id: estimate.id,
          total: estimate.total,
          date: estimate.date,
          status: estimate.status,
          client: estimate.client,
          items: estimate.items,
          tenant: {
            name: estimate.tenant?.name,
            documentNumber: estimate.tenant?.documentNumber,
            phone: estimate.tenant?.phone,
            email: estimate.tenant?.email,
          },
        },
      };
    }

    if (share.type === 'INVOICE') {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: share.resourceId },
        include: {
          client: true,
          items: true,
          tenant: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      let pdfUrl = share.pdfUrl;
      if (!pdfUrl && invoice.pdfUrl) {
        pdfUrl = invoice.pdfUrl;
      }

      return {
        type: 'INVOICE',
        pdfUrl,
        data: {
          id: invoice.id,
          number: invoice.number,
          total: invoice.total,
          status: invoice.status,
          createdAt: invoice.createdAt,
          client: invoice.client,
          items: invoice.items,
          tenant: {
            name: invoice.tenant?.name,
            documentNumber: invoice.tenant?.documentNumber,
            phone: invoice.tenant?.phone,
            email: invoice.tenant?.email,
          },
        },
      };
    }

    throw new BadRequestException('Tipo de compartilhamento inválido');
  }

  // =========================
  // REGENERAR LINK
  // =========================
  async regenerate(token: string) {
    const share = await this.findByToken(token);

    const newToken = randomBytes(32).toString('hex');

    return this.prisma.publicShare.update({
      where: { id: share.id },
      data: {
        token: newToken,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });
  }

  // =========================
  // DELETE
  // =========================
  async delete(token: string) {
    const share = await this.findByToken(token);

    return this.prisma.publicShare.delete({
      where: { id: share.id },
    });
  }
}