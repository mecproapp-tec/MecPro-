import { Controller, Get, Param, Res } from '@nestjs/common';
import { EstimatesService } from '../estimates/estimates.service';
import { InvoicesService } from '../invoices/invoices.service';
import type { Response } from 'express'; // ✅ alterado para import type

@Controller('public')
export class PublicController {
  constructor(
    private readonly estimatesService: EstimatesService,
    private readonly invoicesService: InvoicesService,
  ) {}

  // PDF do orçamento
  @Get('estimates/share/:token')
  async getEstimatePdf(@Param('token') token: string, @Res() res: Response) {
    const pdfBuffer = await this.estimatesService.getPdfByShareToken(token);

    // Transformar PDF em Base64 e colocar em HTML com embed
    const base64 = pdfBuffer.toString('base64');
    const html = `
      <html>
        <head><title>Orçamento</title></head>
        <body style="margin:0">
          <embed src="data:application/pdf;base64,${base64}" type="application/pdf" width="100%" height="100%" />
        </body>
      </html>
    `;
    res.send(html);
  }

  // PDF da fatura
  @Get('invoices/share/:token')
  async getInvoicePdf(@Param('token') token: string, @Res() res: Response) {
    const pdfBuffer = await this.invoicesService.getPdfByShareToken(token);

    const base64 = pdfBuffer.toString('base64');
    const html = `
      <html>
        <head><title>Fatura</title></head>
        <body style="margin:0">
          <embed src="data:application/pdf;base64,${base64}" type="application/pdf" width="100%" height="100%" />
        </body>
      </html>
    `;
    res.send(html);
  }
}