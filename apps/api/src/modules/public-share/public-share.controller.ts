// apps/api/src/modules/public-share/public-share.controller.ts
import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { PublicShareService } from './public-share.service';
import { Response } from 'express';

@Controller('public')
export class PublicShareController {
  constructor(private readonly service: PublicShareService) {}

  // Rota para orçamentos (com /estimates no caminho)
  @Get('estimates/share/:token')
  async getEstimateByToken(@Param('token') token: string, @Res() res: Response) {
    try {
      const result = await this.service.getPublicData(token);
      
      if (result.type === 'ESTIMATE') {
        return res.status(HttpStatus.OK).json({
          success: true,
          data: result.data,
          pdfUrl: result.pdfUrl,
        });
      }
      
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: error.message || 'Link inválido ou expirado',
      });
    }
  }

  // Rota para faturas (com /invoices no caminho)
  @Get('invoices/share/:token')
  async getInvoiceByToken(@Param('token') token: string, @Res() res: Response) {
    try {
      const result = await this.service.getPublicData(token);
      
      if (result.type === 'INVOICE') {
        return res.status(HttpStatus.OK).json({
          success: true,
          data: result.data,
          pdfUrl: result.pdfUrl,
        });
      }
      
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: error.message || 'Link inválido ou expirado',
      });
    }
  }

  // Rota genérica (mantém compatibilidade)
  @Get('share/:token')
  async get(@Param('token') token: string, @Res() res: Response) {
    try {
      const result = await this.service.getPublicData(token);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: error.message || 'Link inválido ou expirado',
      });
    }
  }
}