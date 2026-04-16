// src/modules/appointments/appointments.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(private prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: { clientId: number; date: string; comment?: string },
  ) {
    try {
      if (!tenantId) {
        throw new BadRequestException('TenantId não informado');
      }

      if (!data?.clientId) {
        throw new BadRequestException('Cliente é obrigatório');
      }

      if (!data?.date) {
        throw new BadRequestException('Data é obrigatória');
      }

      const client = await this.prisma.client.findFirst({
        where: { id: data.clientId, tenantId },
      });

      if (!client) {
        throw new BadRequestException(
          'Cliente não encontrado ou não pertence ao seu tenant',
        );
      }

      const appointmentDate = new Date(data.date);

      if (isNaN(appointmentDate.getTime())) {
        throw new BadRequestException('Data inválida');
      }

      this.logger.log(
        `Criando agendamento para tenant ${tenantId}, cliente ${data.clientId}`,
      );

      return await this.prisma.appointment.create({
        data: {
          tenantId,
          clientId: data.clientId,
          date: appointmentDate,
          comment: data.comment?.trim() || null,
        },
        include: { client: true },
      });
    } catch (error) {
      this.logger.error('Erro ao criar agendamento', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro ao criar agendamento',
      );
    }
  }

  async findAll(tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('TenantId inválido');
    }

    this.logger.log(`Buscando agendamentos do tenant ${tenantId}`);

    return this.prisma.appointment.findMany({
      where: { tenantId },
      include: { client: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number, tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('TenantId inválido');
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: { client: true },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return appointment;
  }

  async update(
    id: number,
    tenantId: string,
    data: { clientId?: number; date?: string; comment?: string },
  ) {
    if (!tenantId) {
      throw new BadRequestException('TenantId inválido');
    }

    await this.findOne(id, tenantId);

    if (data.clientId !== undefined) {
      const client = await this.prisma.client.findFirst({
        where: { id: data.clientId, tenantId },
      });

      if (!client) {
        throw new BadRequestException(
          'Cliente não encontrado ou não pertence ao seu tenant',
        );
      }
    }

    const updateData: any = {};

    if (data.clientId !== undefined) {
      updateData.clientId = data.clientId;
    }

    if (data.date !== undefined) {
      const parsedDate = new Date(data.date);

      if (isNaN(parsedDate.getTime())) {
        throw new BadRequestException('Data inválida');
      }

      updateData.date = parsedDate;
    }

    if (data.comment !== undefined) {
      updateData.comment = data.comment?.trim() || null;
    }

    return this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: { client: true },
    });
  }

  async remove(id: number, tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('TenantId inválido');
    }

    await this.findOne(id, tenantId);

    try {
      await this.prisma.appointment.delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Erro ao deletar agendamento', error);

      throw new InternalServerErrorException(
        'Erro ao excluir agendamento',
      );
    }
  }
}