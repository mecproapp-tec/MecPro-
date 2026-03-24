import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async create(data: { userEmail?: string; userName?: string; message: string; tenantId?: string }) {
    return this.prisma.contactMessage.create({
      data: {
        userEmail: data.userEmail,
        userName: data.userName,
        message: data.message,
        tenantId: data.tenantId,
        status: 'pending',
      },
    });
  }

  async findAll() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      include: { tenant: true },
    });
  }

  async findOne(id: number) {
    const message = await this.prisma.contactMessage.findUnique({
      where: { id },
      include: { tenant: true },
    });
    if (!message) throw new NotFoundException('Mensagem não encontrada');
    return message;
  }

  async reply(id: number, reply: string) {
    const message = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!message) throw new NotFoundException('Mensagem não encontrada');
    return this.prisma.contactMessage.update({
      where: { id },
      data: {
        reply,
        status: 'replied',
      },
    });
  }

  async remove(id: number) {
    return this.prisma.contactMessage.delete({ where: { id } });
  }
}