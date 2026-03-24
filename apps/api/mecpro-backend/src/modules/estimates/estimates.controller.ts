import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Res, BadRequestException } from '@nestjs/common';
import { EstimatesService } from './estimates.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { Response } from 'express';

@Controller('estimates')
@UseGuards(JwtAuthGuard)
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Post()
  create(@Body() data: { clientId: number; date: string; items: any[] }, @Req() req) {
    return this.estimatesService.create(req.user.tenantId, data);
  }

  @Get()
  findAll(@Req() req) {
    return this.estimatesService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.estimatesService.findOne(Number(id), req.user.tenantId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: { clientId: number; date: string; items: any[]; status?: string },
    @Req() req,
  ) {
    return this.estimatesService.update(Number(id), req.user.tenantId, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.estimatesService.remove(Number(id), req.user.tenantId);
  }

 @Post(':id/share')
async generateShareLink(@Param('id') id: string, @Req() req) {
  const token = await this.estimatesService.generateShareToken(Number(id), req.user.tenantId);
  const baseUrl = process.env.APP_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  const url = `${baseUrl}/api/public/estimates/share/${token}`;
  return { url };
}

  @Post(':id/send-whatsapp')
  async sendViaWhatsApp(@Param('id') id: string, @Req() req) {
    const result = await this.estimatesService.sendViaWhatsApp(Number(id), req.user.tenantId);
    return result;
  }
}

@Controller('public/estimates')
export class PublicEstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Get('share/:token')
  async getSharedPdf(@Param('token') token: string, @Res() res: Response) {
    if (!token) {
      throw new BadRequestException('Token não fornecido');
    }
    const pdfBuffer = await this.estimatesService.getPdfByShareToken(token);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=orcamento-compartilhado.pdf`);
    res.send(pdfBuffer);
  }
}