import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { BrowserPoolService } from '../../shared/browser-pool.service';

@Injectable()
export class InvoicesPdfService {
  private readonly logger = new Logger(InvoicesPdfService.name);

  constructor(private readonly browserPool: BrowserPoolService) {}

  async generateInvoicePdf(invoice: any, tenant: any): Promise<Buffer> {
    this.logger.log(`Gerando PDF da fatura ${invoice.id}`);

    try {
      // 1. Extrair dados do cliente (exatamente como nos orçamentos)
      const client = invoice.client;
      const vehicleDetails = client?.vehicleBrand && client?.vehicleModel
        ? `${client.vehicleBrand} ${client.vehicleModel}${client.vehicleYear ? ` ${client.vehicleYear}` : ''}${client.vehicleColor ? ` - ${client.vehicleColor}` : ''}`.trim()
        : client?.vehicle || 'Não informado';
      const plate = client?.plate || 'Não informado';

      // 2. Processar itens
      let subtotal = 0;
      let issTotal = 0;
      const items = invoice.items.map((item: any) => {
        const itemTotal = item.price * item.quantity;
        const iss = item.issPercent ? itemTotal * (item.issPercent / 100) : 0;
        subtotal += itemTotal;
        issTotal += iss;
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.price.toFixed(2),
          issPercent: item.issPercent || 0,
          total: (itemTotal + iss).toFixed(2),
        };
      });
      const total = subtotal + issTotal;

      // 3. Datas e status
      const issueDate = new Date(invoice.createdAt).toLocaleDateString('pt-BR');
      const dueDate = ''; // opcional
      const statusMap: Record<string, string> = {
        PENDING: 'Pendente',
        PAID: 'Paga',
        CANCELED: 'Cancelada',
      };
      const status = statusMap[invoice.status] || invoice.status || 'Pendente';

      // 4. Dados da oficina (mesmo fallback dos orçamentos)
      const companyName = tenant?.name || process.env.COMPANY_NAME || 'Oficina Mecânica';
      const companyDocument = tenant?.documentNumber || process.env.COMPANY_DOCUMENT || '00.000.000/0001-00';
      const companyPhone = tenant?.phone || process.env.COMPANY_PHONE || '(11) 1234-5678';
      const companyEmail = tenant?.email || process.env.COMPANY_EMAIL || 'contato@oficina.com';
      const logoUrl = tenant?.logoUrl || process.env.LOGO_URL || '';

      // 5. Carregar template (sem fallback inline)
      const templatePath = path.join(__dirname, 'invoice-pdf.hbs');
      const templateContent = await readFile(templatePath, 'utf-8');
      this.logger.log(`Template carregado de ${templatePath}`);

      const compiledTemplate = Handlebars.compile(templateContent);
      const data = {
        invoiceNumber: invoice.number,
        client: {
          name: client.name,
          document: client.document || 'Não informado',
          address: client.address || 'Não informado',
          phone: client.phone,
          vehicle: vehicleDetails,
          plate,
        },
        issueDate,
        dueDate,
        status,
        items,
        subtotal: subtotal.toFixed(2),
        issValue: issTotal.toFixed(2),
        total: total.toFixed(2),
        companyName,
        companyDocument,
        companyPhone,
        companyEmail,
        logoUrl,
      };

      const html = compiledTemplate(data);
      this.logger.debug(`HTML gerado, tamanho: ${html.length}`);

      // 6. Gerar PDF com Puppeteer (exatamente como nos orçamentos)
      const browser = await this.browserPool.getBrowser();
      const page = await browser.newPage();

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      });

      await page.close();

      this.logger.log(`PDF gerado com sucesso, tamanho: ${pdfBuffer.length} bytes`);
      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error(`Erro ao gerar PDF da fatura ${invoice.id}:`, error.stack);
      throw new InternalServerErrorException('Erro ao gerar PDF da fatura. Verifique os logs.');
    }
  }
}