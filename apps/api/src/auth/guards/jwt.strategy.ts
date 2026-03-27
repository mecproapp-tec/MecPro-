import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'SUPER_SECRET_KEY',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (!payload.sessionToken) {
      throw new UnauthorizedException('Token de sessão não fornecido');
    }

    const session = await this.prisma.userSession.findFirst({
      where: {
        userId: user.id,
        sessionToken: payload.sessionToken,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Sessão expirada ou inválida');
    }

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { lastActivity: new Date() },
    });

    return {
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      sessionToken: payload.sessionToken,
    };
  }
}
