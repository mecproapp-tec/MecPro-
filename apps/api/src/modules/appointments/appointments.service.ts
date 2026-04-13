// apps/api/src/modules/appointments/appointments.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: { clientId: number; date: string; comment?: string }) {
    this.logger.log(`Criando agendamento para tenant ${tenantId}, cliente ${data.clientId}`);

    const client = await this.prisma.client.findFirst({
      where: { id: data.clientId, tenantId },
    });
    if (!client) {
      throw new BadRequestException('Cliente não encontrado ou não pertence ao seu tenant');
    }

    const appointmentDate = new Date(data.date);
    if (isNaN(appointmentDate.getTime())) {
      throw new BadRequestException('Data inválida');
    }

    return this.prisma.appointment.create({
      data: {
        tenantId,
        clientId: data.clientId,
        date: appointmentDate,
        comment: data.comment,
      },
      include: { client: true }, // ✅ inclui dados do cliente
    });
  }

  async findAll(tenantId: string) {
    this.logger.log(`Buscando agendamentos do tenant ${tenantId}`);
    return this.prisma.appointment.findMany({
      where: { tenantId },
      include: { client: true }, // ✅ inclui dados do cliente
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number, tenantId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: { client: true }, // ✅ ESSENCIAL para o frontend exibir o nome
    });
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }
    return appointment;
  }

  async update(id: number, tenantId: string, data: { clientId?: number; date?: string; comment?: string }) {
    await this.findOne(id, tenantId);

    if (data.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: data.clientId, tenantId },
      });
      if (!client) {
        throw new BadRequestException('Cliente não encontrado ou não pertence ao seu tenant');
      }
    }

    const updateData: any = {};
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.comment !== undefined) updateData.comment = data.comment;

    return this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: { client: true },
    });
  }

  async remove(id: number, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.appointment.delete({ where: { id } });
    return { success: true };
  }
}