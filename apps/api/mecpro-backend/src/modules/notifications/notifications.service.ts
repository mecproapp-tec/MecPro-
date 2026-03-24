import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.notification.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: number, tenantId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, tenantId },
    });
    if (!notification) throw new NotFoundException('Notificação não encontrada');
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(tenantId: string) {
    return this.prisma.notification.updateMany({
      where: { tenantId, read: false },
      data: { read: true },
    });
  }

  // Método para criar notificação (usado pelo cron)
  async create(tenantId: string, title: string, message: string) {
    return this.prisma.notification.create({
      data: {
        tenantId,
        title,
        message,
        read: false,
        isGlobal: false,
      },
    });
  }
}