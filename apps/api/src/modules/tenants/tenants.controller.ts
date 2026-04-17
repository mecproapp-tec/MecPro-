// apps/api/src/modules/tenants/tenants.controller.ts
import { Controller, Get, Put, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SessionGuard } from '../../auth/guards/session.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { TenantsService } from './tenants.service';

interface UserPayload {
  id: number;
  tenantId: string;
  role: string;
  sessionToken: string;
}

@Controller('tenants')
@UseGuards(JwtAuthGuard, SessionGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  async getMyTenant(@CurrentUser() user: UserPayload) {
    const tenant = await this.tenantsService.getById(user.tenantId);
    return {
      success: true,
      data: {
        nome: tenant.name,
        tipoDocumento: tenant.documentType,
        documento: tenant.documentNumber,
        numero: this.extractNumberFromAddress(tenant.address),
        endereco: this.extractStreetFromAddress(tenant.address),
        telefone: tenant.phone,
        email: tenant.email,
        logo: tenant.logoUrl,
      },
    };
  }

  @Put('me')
  async updateMyTenant(@Body() data: any, @CurrentUser() user: UserPayload) {
    // Validação básica
    if (!data.nome && !data.documento && !data.email && !data.telefone && !data.endereco && !data.numero && !data.logo) {
      throw new BadRequestException('Nenhum dado para atualizar');
    }
    const updated = await this.tenantsService.update(user.tenantId, data);
    return {
      success: true,
      message: 'Dados da oficina atualizados com sucesso',
      data: updated,
    };
  }

  private extractNumberFromAddress(address?: string): string {
    if (!address) return '';
    const match = address.match(/\b(\d+)\b/);
    return match ? match[1] : '';
  }

  private extractStreetFromAddress(address?: string): string {
    if (!address) return '';
    return address.replace(/\s\d+$/, '').trim();
  }
}