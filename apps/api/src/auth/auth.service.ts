import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

// ... imports permanecem iguais

@Injectable()
export class AuthService {
  // ... outros métodos permanecem iguais

  async registerTenant(data: {
    officeName: string;
    documentType: string;
    documentNumber: string;
    cep: string;
    address: string;
    email: string;
    phone: string;
    ownerName: string;
    password: string;
    paymentCompleted: boolean; // não usado mais, mantido por compatibilidade
  }) {
    // 1. Verificar se já existe usuário com esse e-mail
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new BadRequestException('Email já cadastrado');
    }

    // 2. Verificar se já existe tenant com esse documento
    const existingTenant = await this.prisma.tenant.findUnique({ where: { documentNumber: data.documentNumber } });
    if (existingTenant) {
      throw new BadRequestException('Documento já cadastrado');
    }

    // 3. Buscar assinatura pendente para este e-mail
    const pending = await this.prisma.pendingSubscription.findUnique({
      where: { email: data.email },
    });

    if (!pending) {
      throw new BadRequestException('Pagamento não confirmado. Efetue o pagamento antes de cadastrar.');
    }

    // 4. Criar o tenant com os dados da pendência
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.officeName,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        cep: data.cep,
        address: data.address,
        email: data.email,
        phone: data.phone,
        status: 'ACTIVE',
        trialEndsAt: pending.trialEndsAt,      // data do fim do trial (30 dias)
        subscriptionId: pending.subscriptionId, // ID da assinatura no MP
        paymentStatus: 'trial',                // iniciou em trial
      },
    });

    // 5. Criar o usuário proprietário
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: data.ownerName,
        email: data.email,
        password: hashedPassword,
        role: 'OWNER',
        tenantId: tenant.id,
      },
    });

    // 6. Remover a pendência (já foi usada)
    await this.prisma.pendingSubscription.delete({
      where: { id: pending.id },
    });

    // 7. Gerar tokens de acesso
    const payload = { sub: user.id, tenantId: user.tenantId, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.generateRefreshToken();

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      message: 'Cadastro realizado com sucesso',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        officeName: tenant.name,
      },
    };
  }

  // ... restante do arquivo (registerAdmin, login, etc.) permanece igual
}