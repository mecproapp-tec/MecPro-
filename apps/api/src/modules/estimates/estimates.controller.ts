// apps/api/src/modules/estimates/estimates.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { EstimatesService } from './estimates.service';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';

interface UserPayload {
  id: number;
  tenantId: string;
  role: string;
  sessionToken: string;
}

@UseGuards(JwtAuthGuard)
@Controller('estimates')
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Get()
  async findAll(
    @CurrentUser() user: UserPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    if (!user) throw new UnauthorizedException('Usuário não autenticado');
    if (!user.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.estimatesService.findAll(user.tenantId, parseInt(page), parseInt(limit));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    const estimateId = this.parseId(id);
    return this.estimatesService.findOne(estimateId, user.tenantId);
  }

  @Get(':id/share')
  async getShareLink(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    const estimateId = this.parseId(id);
    const shareUrl = await this.estimatesService.generateShareLink(estimateId, user.tenantId);
    return { shareUrl };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateEstimateDto, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.estimatesService.create(user.tenantId, createDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEstimateDto,
    @CurrentUser() user: UserPayload,
  ) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    const estimateId = this.parseId(id);
    return this.estimatesService.update(estimateId, user.tenantId, updateDto);
  }

  @Post(':id/convert')
  async convertToInvoice(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    const estimateId = this.parseId(id);
    const invoice = await this.estimatesService.convertToInvoice(estimateId, user.tenantId);
    return { message: 'Orçamento convertido em fatura com sucesso', invoice };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    const estimateId = this.parseId(id);
    await this.estimatesService.remove(estimateId, user.tenantId);
  }

  @Post(':id/send-whatsapp')
  async sendToWhatsApp(
    @Param('id') id: string,
    @Body('phoneNumber') phoneNumber: string,
    @CurrentUser() user: UserPayload,
  ) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    const estimateId = this.parseId(id);
    
    // Se phoneNumber não foi enviado, busca do cliente
    let finalPhone = phoneNumber;
    if (!finalPhone) {
      const estimate = await this.estimatesService.findOne(estimateId, user.tenantId);
      finalPhone = estimate.client?.phone;
      if (!finalPhone) throw new BadRequestException('Cliente sem telefone cadastrado');
    }
    
    return this.estimatesService.sendToWhatsApp(estimateId, user.tenantId, finalPhone);
  }

  @Post(':id/resend-pdf')
  async resendPdf(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    const estimateId = this.parseId(id);
    return this.estimatesService.resendPdf(estimateId, user.tenantId);
  }

  private parseId(id: string): number {
    const numericId = Number(id);
    if (isNaN(numericId)) throw new BadRequestException('ID inválido');
    return numericId;
  }
}