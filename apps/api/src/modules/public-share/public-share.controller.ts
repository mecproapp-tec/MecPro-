import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { PublicShareService } from './public-share.service';
import { Response } from 'express';

@Controller('public')
export class PublicShareController {
  constructor(private readonly service: PublicShareService) {}

  @Get('estimates/share/:token')
  async getEstimateByToken(@Param('token') token: string, @Res() res: Response) {
    try {
      const data = await this.service.getPublicData(token);
      return res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: error.message || 'Link inválido ou expirado',
      });
    }
  }

  @Get('invoices/share/:token')
  async getInvoiceByToken(@Param('token') token: string, @Res() res: Response) {
    try {
      const data = await this.service.getPublicData(token);
      return res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: error.message || 'Link inválido ou expirado',
      });
    }
  }
}