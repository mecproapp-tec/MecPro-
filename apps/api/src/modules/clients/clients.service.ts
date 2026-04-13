import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Client, Prisma } from '@prisma/client';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any): Promise<Client> {
    if (!data.name || !data.phone) {
      throw new BadRequestException('Nome e telefone são obrigatórios');
    }
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Tenant não encontrado');

    return this.prisma.client.create({
      data: {
        tenantId,
        name: data.name,
        phone: data.phone,
        vehicle: data.vehicle || null,
        plate: data.plate || null,
        document: data.document || null,
        address: data.address || null,
      },
    });
  }

  async findAll(tenantId: string, page = 1, limit = 50) {
    if (!tenantId) throw new BadRequestException('TenantId inválido');
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
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
      }),
      this.prisma.client.count({ where: { tenantId } }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number, tenantId: string): Promise<Partial<Client>> {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
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
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return client;
  }

  async update(id: number, tenantId: string, data: any): Promise<Client> {
    await this.findOne(id, tenantId);
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

  async remove(id: number, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId);
    try {
      await this.prisma.client.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('Cliente possui registros relacionados (agendamentos, orçamentos ou faturas).');
      }
      throw new InternalServerErrorException('Erro ao excluir cliente');
    }
  }
}