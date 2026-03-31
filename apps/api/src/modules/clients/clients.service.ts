import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Client, Prisma } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(
    tenantId: string | number,
    data: {
      name: string;
      phone: string;
      vehicle: string;
      plate: string;
      document?: string;
      address?: string;
    },
  ): Promise<Client> {
    const tenantIdStr = String(tenantId);
    return this.prisma.client.create({
      data: {
        tenantId: tenantIdStr,
        name: data.name,
        phone: data.phone,
        vehicle: data.vehicle,
        plate: data.plate,
        document: data.document ?? null,
        address: data.address ?? null,
      },
    });
  }

  async findAll(
    tenantId: string | number,
    userRole?: string,
  ): Promise<Partial<Client>[]> {
    const tenantIdStr = String(tenantId);
    const where: any = {};
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      where.tenantId = tenantIdStr;
    }
    return this.prisma.client.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        vehicle: true,
        plate: true,
        address: true,
        document: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(
    id: number,
    tenantId: string | number,
    userRole?: string,
  ): Promise<Partial<Client>> {
    const tenantIdStr = String(tenantId);
    const where: any = { id };
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      where.tenantId = tenantIdStr;
    }
    const client = await this.prisma.client.findFirst({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        vehicle: true,
        plate: true,
        address: true,
        document: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return client;
  }

  async update(
    id: number,
    tenantId: string | number,
    data: Partial<Omit<Client, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
    userRole?: string,
  ): Promise<Client> {
    await this.findOne(id, tenantId, userRole);
    return this.prisma.client.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        vehicle: data.vehicle,
        plate: data.plate,
        document: data.document,
        address: data.address,
      },
    });
  }

  async remove(
    id: number,
    tenantId: string | number,
    userRole?: string,
  ): Promise<{ message: string }> {
    // Verifica se o cliente existe e tem permissão
    await this.findOne(id, tenantId, userRole);

    try {
      await this.prisma.client.delete({ where: { id } });
      return { message: 'Cliente removido com sucesso' };
    } catch (error) {
      // Caso ainda haja dependência não tratada pelo cascade (ex: se alguma relação não tiver cascade)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new InternalServerErrorException(
          'Não é possível excluir o cliente pois existem registros relacionados (agendamentos, orçamentos ou faturas). Verifique as dependências.',
        );
      }
      // Outros erros inesperados
      console.error('Erro ao excluir cliente:', error);
      throw new InternalServerErrorException('Erro interno ao excluir cliente.');
    }
  }
}