// apps/api/src/modules/invoices/invoices-pdf.service.ts
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

@Injectable()
export class InvoicesPdfService {
  private readonly logger = new Logger(InvoicesPdfService.name);
  private templateCache: HandlebarsTemplateDelegate | null = null;

  constructor() {
    this.logger.log('InvoicesPdfService inicializado');
  }

  private async getBrowser() {
    // PRIORIDADE 1: Chrome do Windows configurado no .env
    const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    
    if (fs.existsSync(chromePath)) {
      this.logger.log(`✅ Usando Chrome: ${chromePath}`);
      return puppeteer.launch({
        executablePath: chromePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        headless: true,
      });
    }
    
    // PRIORIDADE 2: Tentar caminho alternativo (32 bits)
    const altPath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
    if (fs.existsSync(altPath)) {
      this.logger.log(`✅ Usando Chrome alternativo: ${altPath}`);
      return puppeteer.launch({
        executablePath: altPath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        headless: true,
      });
    }
    
    // PRIORIDADE 3: Tentar Chromium baixado pelo puppeteer
    this.logger.warn('Chrome não encontrado, tentando Chromium padrão...');
    return puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
  }

  private loadTemplate(): HandlebarsTemplateDelegate {
    if (this.templateCache) {
      return this.templateCache;
    }

    try {
      let templatePath: string | null = null;
      const possiblePaths = [
        path.join(__dirname, 'templates', 'invoice-pdf.hbs'),
        path.join(__dirname, 'invoice-pdf.hbs'),
        path.join(process.cwd(), 'dist', 'modules', 'invoices', 'templates', 'invoice-pdf.hbs'),
        path.join(process.cwd(), 'src', 'modules', 'invoices', 'templates', 'invoice-pdf.hbs'),
      ];

      for (const tryPath of possiblePaths) {
        if (fs.existsSync(tryPath)) {
          templatePath = tryPath;
          this.logger.log(`Template encontrado em: ${tryPath}`);
          break;
        }
      }

      if (!templatePath) {
        throw new Error(`Template não encontrado. Procurado em: ${possiblePaths.join(', ')}`);
      }

      const templateHtml = fs.readFileSync(templatePath, 'utf-8');
      this.templateCache = Handlebars.compile(templateHtml);
      return this.templateCache;
    } catch (error) {
      this.logger.error('Erro ao carregar template de fatura', error);
      throw new InternalServerErrorException('Erro ao carregar template de PDF');
    }
  }

  async generateInvoicePdf(invoice: any): Promise<Buffer> {
    if (!invoice) {
      throw new InternalServerErrorException('Dados inválidos para gerar PDF');
    }

    let browser = null;
    
    try {
      const compiledTemplate = this.loadTemplate();

      const client = invoice.client || {};
      const tenant = invoice.tenant || {};

      let subtotal = 0;
      const items = (invoice.items || []).map((item: any) => {
        const quantity = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const total = quantity * price;
        subtotal += total;

        return {
          description: item.description || '-',
          quantity: quantity,
          unitPrice: price.toFixed(2),
          total: total.toFixed(2),
        };
      });

      const issueDateObj = invoice.createdAt ? new Date(invoice.createdAt) : new Date();

      const html = compiledTemplate({
        invoiceNumber: invoice.number || invoice.id,
        status: invoice.status === 'PENDING' ? 'PENDENTE' : invoice.status === 'PAID' ? 'PAGA' : 'CANCELADA',
        
        client: {
          name: client.name || 'Cliente não informado',
          phone: client.phone || '-',
          vehicle: client.vehicle || '-',
          plate: client.plate || '-',
          document: client.document || '-',
          address: client.address || '-',
        },
        
        items: items,
        
        subtotal: subtotal.toFixed(2),
        total: invoice.total?.toFixed(2) || subtotal.toFixed(2),
        
        companyName: tenant.name || 'MecPro',
        companyDocument: tenant.documentNumber || 'CNPJ: --',
        companyPhone: tenant.phone || '(11) 99999-9999',
        companyEmail: tenant.email || 'contato@mecpro.com.br',
        
        issueDate: issueDateObj.toLocaleDateString('pt-BR'),
      });

      this.logger.log(`Gerando PDF para fatura ${invoice.id} (${items.length} itens)`);

      browser = await this.getBrowser();

      const page = await browser.newPage();
      
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px',
        },
      });

      this.logger.log(`PDF gerado com sucesso: ${pdf.length} bytes`);
      return Buffer.from(pdf);
      
    } catch (error) {
      this.logger.error(`Erro ao gerar PDF para fatura ${invoice.id}`, error);
      throw new InternalServerErrorException(`Erro ao gerar PDF: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}