// apps/api/src/modules/tenants/tenants.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async getById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        documentType: true,
        documentNumber: true,
        cep: true,
        address: true,
        email: true,
        phone: true,
        logoUrl: true,
        status: true,
        trialEndsAt: true,
        createdAt: true,
        updatedAt: true,
        paymentStatus: true,
        subscriptionId: true,
        users: {
          select: { id: true, name: true, email: true, role: true, createdAt: true },
        },
        subscriptions: {
          select: { id: true, planName: true, price: true, status: true, startDate: true, endDate: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!tenant) throw new NotFoundException('Oficina não encontrada');
    return tenant;
  }

  async update(id: string, data: any) {
    const updateData: any = {};

    if (data.nome !== undefined) updateData.name = data.nome;
    if (data.documento !== undefined) updateData.documentNumber = data.documento;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.telefone !== undefined) updateData.phone = data.telefone;
    if (data.logo !== undefined) updateData.logoUrl = data.logo;

    // Concatena endereço e número
    if (data.endereco !== undefined || data.numero !== undefined) {
      const endereco = data.endereco || '';
      const numero = data.numero || '';
      updateData.address = `${endereco} ${numero}`.trim();
    }

    // Atualiza documentType se necessário (o frontend não envia tipoDocumento? mas pode)
    if (data.tipoDocumento !== undefined) {
      updateData.documentType = data.tipoDocumento;
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        documentNumber: true,
        email: true,
        phone: true,
        logoUrl: true,
        address: true,
        documentType: true,
        updatedAt: true,
      },
    });
    return updated;
  }
}