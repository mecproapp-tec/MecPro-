import { Injectable, Logger } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
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
      // Verificar dados recebidos
      this.logger.debug(`Dados da fatura: ${JSON.stringify(invoice, null, 2).substring(0, 500)}`);
      this.logger.debug(`Dados do tenant: ${JSON.stringify(tenant, null, 2).substring(0, 500)}`);

      const client = invoice.client;
      if (!client) {
        this.logger.error(`Cliente ausente na fatura ${invoice.id}`);
        throw new Error('Cliente não encontrado na fatura');
      }

      const vehicleDetails =
        client?.vehicleBrand && client?.vehicleModel
          ? `${client.vehicleBrand} ${client.vehicleModel}${
              client.vehicleYear ? ` ${client.vehicleYear}` : ''
            }${client.vehicleColor ? ` - ${client.vehicleColor}` : ''}`.trim()
          : client?.vehicle || 'Não informado';

      const plate = client?.plate || 'Não informado';

      let subtotal = 0;
      let issTotal = 0;

      const itemsWithTotal = invoice.items.map((item: any) => {
        const itemTotal = item.price * item.quantity;
        const iss = item.issPercent ? itemTotal * (item.issPercent / 100) : 0;
        subtotal += itemTotal;
        issTotal += iss;
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.price.toFixed(2),
          total: (itemTotal + iss).toFixed(2),
        };
      });

      const total = subtotal + issTotal;

      const templatePath = path.join(__dirname, 'invoice-pdf.hbs');
      this.logger.log(`Lendo template de: ${templatePath}`);
      let templateContent: string;
      try {
        templateContent = await readFile(templatePath, 'utf-8');
        this.logger.log(`Template carregado, tamanho: ${templateContent.length}`);
      } catch (err: any) {
        this.logger.error(`Falha ao ler template: ${err.message}`);
        throw new Error(`Template não encontrado em ${templatePath}`);
      }

      const compiledTemplate = Handlebars.compile(templateContent);

      const data = {
        invoiceNumber: invoice.number,
        client: {
          name: client.name,
          document: client.document || 'Não informado',
          address: client.address || '',
          phone: client.phone,
          vehicle: vehicleDetails,
          plate,
        },
        issueDate: new Date(invoice.createdAt).toLocaleDateString('pt-BR'),
        dueDate: '',
        status: this.getStatusText(invoice.status),
        items: itemsWithTotal,
        subtotal: subtotal.toFixed(2),
        issValue: issTotal.toFixed(2),
        total: total.toFixed(2),
        companyName: tenant?.name || process.env.COMPANY_NAME || 'Oficina',
        companyDocument: tenant?.documentNumber || process.env.COMPANY_DOCUMENT || '',
        companyPhone: tenant?.phone || process.env.COMPANY_PHONE || '',
        companyEmail: tenant?.email || process.env.COMPANY_EMAIL || '',
        logoUrl: tenant?.logoUrl || process.env.LOGO_URL || '',
      };

      const html = compiledTemplate(data);
      this.logger.debug(`HTML gerado, tamanho: ${html.length}`);

      // Salvar HTML para inspeção
      const htmlPath = `/tmp/invoice-${invoice.id}.html`;
      try {
        await writeFile(htmlPath, html);
        this.logger.log(`HTML salvo em ${htmlPath}`);
      } catch (err: any) {
        this.logger.warn(`Não foi possível salvar HTML: ${err.message}`);
      }

      this.logger.log('Obtendo navegador do pool...');
      const browser = await this.browserPool.getBrowser();
      const page = await browser.newPage();

      // Tipar os erros como Error
      page.on('pageerror', (err: Error) => {
        this.logger.error(`Erro de página no Puppeteer: ${err.message}`);
      });
      page.on('error', (err: Error) => {
        this.logger.error(`Erro do navegador: ${err.message}`);
      });
      page.on('console', (msg: any) => {
        this.logger.debug(`Console da página: ${msg.text()}`);
      });

      this.logger.log('Injetando HTML...');
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
      this.logger.log('HTML injetado, gerando PDF...');

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
        timeout: 60000,
      });

      await page.close();

      this.logger.log(`PDF gerado com sucesso, tamanho: ${pdfBuffer.length} bytes`);
      return Buffer.from(pdfBuffer);
    } catch (error: any) {
      this.logger.error(`Erro ao gerar PDF da fatura ${invoice.id}:`, error);
      throw error;
    }
  }

  private getStatusText(status: string): string {
    const map: Record<string, string> = {
      PAID: 'Paga',
      PENDING: 'Pendente',
      CANCELED: 'Cancelada',
    };
    return map[status] || 'Desconhecido';
  }
}