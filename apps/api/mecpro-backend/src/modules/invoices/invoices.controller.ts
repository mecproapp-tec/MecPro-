import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Res, BadRequestException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { Response } from 'express';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() data: { clientId: number; items: any[]; status?: 'PENDING' | 'PAID' | 'CANCELED' }, @Req() req) {
    return this.invoicesService.create(req.user.tenantId, data);
  }

  @Get()
  findAll(@Req() req) {
    return this.invoicesService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.invoicesService.findOne(Number(id), req.user.tenantId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: { clientId: number; items: any[]; status?: 'PENDING' | 'PAID' | 'CANCELED' }, @Req() req) {
    return this.invoicesService.update(Number(id), req.user.tenantId, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.invoicesService.remove(Number(id), req.user.tenantId);
  }

  @Get(':id/pdf')
  async generatePdf(@Param('id') id: string, @Req() req, @Res() res: Response) {
    const pdfBuffer = await this.invoicesService.generatePdf(Number(id), req.user.tenantId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=fatura-${id}.pdf`);
    res.send(pdfBuffer);
  }

@Post(':id/share')
async generateShareLink(@Param('id') id: string, @Req() req) {
  const token = await this.invoicesService.generateShareToken(Number(id), req.user.tenantId);
  const baseUrl = process.env.APP_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  const url = `${baseUrl}/api/public/invoices/share/${token}`;
  return { url };
}

  @Post(':id/send-whatsapp')
  async sendViaWhatsApp(@Param('id') id: string, @Req() req) {
    const result = await this.invoicesService.sendViaWhatsApp(Number(id), req.user.tenantId);
    return result;
  }
}

@Controller('public/invoices')
export class PublicInvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('share/:token')
  async getSharedPdf(@Param('token') token: string, @Res() res: Response) {
    if (!token) {
      throw new BadRequestException('Token não fornecido');
    }
    const pdfBuffer = await this.invoicesService.getPdfByShareToken(token);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=fatura-compartilhada.pdf`);
    res.send(pdfBuffer);
  }
}