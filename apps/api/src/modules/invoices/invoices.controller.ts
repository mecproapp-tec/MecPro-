import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

interface UserPayload {
  id: number;
  tenantId: string;
  role: string;
  sessionToken: string;
}

@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async findAll(
    @CurrentUser() user: UserPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    if (!user) throw new UnauthorizedException('Usuário não autenticado');
    if (!user.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.invoicesService.findAll(user.tenantId, parseInt(page), parseInt(limit));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    const invoiceId = this.parseId(id);
    return this.invoicesService.findOne(invoiceId, user.tenantId);
  }

  @Get(':id/share')
  async getShareLink(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    const invoiceId = this.parseId(id);
    const shareUrl = await this.invoicesService.generateShareLink(invoiceId, user.tenantId);
    return { shareUrl };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateInvoiceDto, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.invoicesService.create(user.tenantId, createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateInvoiceDto,
    @CurrentUser() user: UserPayload,
  ) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    const invoiceId = this.parseId(id);
    return this.invoicesService.update(invoiceId, user.tenantId, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    const invoiceId = this.parseId(id);
    await this.invoicesService.remove(invoiceId, user.tenantId);
  }

  @Post(':id/send-whatsapp')
  async sendToWhatsApp(
    @Param('id') id: string,
    @Body('phoneNumber') phoneNumber: string,
    @CurrentUser() user: UserPayload,
  ) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    const invoiceId = this.parseId(id);
    // Se não enviou número, busca do cliente
    let finalPhone = phoneNumber;
    if (!finalPhone) {
      const invoice = await this.invoicesService.findOne(invoiceId, user.tenantId);
      finalPhone = invoice.client?.phone;
      if (!finalPhone) throw new BadRequestException('Cliente sem telefone cadastrado');
    }
    return this.invoicesService.sendToWhatsApp(invoiceId, user.tenantId, finalPhone);
  }

  @Post(':id/resend-pdf')
  async resendPdf(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    const invoiceId = this.parseId(id);
    return this.invoicesService.resendPdf(invoiceId, user.tenantId);
  }

  private parseId(id: string): number {
    const numericId = Number(id);
    if (isNaN(numericId)) throw new BadRequestException('ID inválido');
    return numericId;
  }
}