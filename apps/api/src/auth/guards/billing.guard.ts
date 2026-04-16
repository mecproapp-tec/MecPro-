import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class BillingGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    if (!user.tenantId) {
      throw new UnauthorizedException('Tenant não encontrado no token');
    }

    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant não encontrado no sistema');
    }

    if (tenant.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Sua conta está inativa. Entre em contato com o suporte.',
      );
    }

    const allowedPaymentStatuses = ['paid', 'trial'];
    if (!allowedPaymentStatuses.includes(tenant.paymentStatus ?? '')) {
      throw new ForbiddenException(
        'Pagamento pendente. Acesse o link de pagamento para regularizar sua assinatura.',
      );
    }

    if (
      tenant.paymentStatus === 'trial' &&
      tenant.trialEndsAt &&
      new Date() > new Date(tenant.trialEndsAt)
    ) {
      throw new ForbiddenException(
        'Seu período de teste expirou. Faça o upgrade para continuar usando o sistema.',
      );
    }

    return true;
  }
}