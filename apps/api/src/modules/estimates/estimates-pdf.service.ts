import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { BrowserPoolService } from '../../shared/browser-pool.service';

@Injectable()
export class EstimatesPdfService {
  private readonly logger = new Logger(EstimatesPdfService.name);

  constructor(private readonly browserPool: BrowserPoolService) {}

  async generateEstimatePdf(estimate: any, tenant: any): Promise<Buffer> {
    this.logger.log(`Gerando PDF do orçamento ${estimate.id}`);

    try {
      const client = estimate.client || {};
      const vehicleDetails =
        client?.vehicleBrand && client?.vehicleModel
          ? `${client.vehicleBrand} ${client.vehicleModel}${client.vehicleYear ? ` ${client.vehicleYear}` : ''}${client.vehicleColor ? ` - ${client.vehicleColor}` : ''}`.trim()
          : client?.vehicle || 'Não informado';
      const plate = client?.plate || 'Não informado';

      let subtotal = 0;
      let issTotal = 0;
      const items = (estimate.items || []).map((item: any) => {
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        const itemTotal = price * quantity;
        const iss = item.issPercent ? itemTotal * (item.issPercent / 100) : 0;
        subtotal += itemTotal;
        issTotal += iss;
        return {
          description: item.description,
          quantity,
          unitPrice: price.toFixed(2),
          issPercent: item.issPercent || 0,
          total: (itemTotal + iss).toFixed(2),
        };
      });
      const total = subtotal + issTotal;

      const issueDate = new Date(estimate.date).toLocaleDateString('pt-BR');
      const validUntil = new Date(new Date(estimate.date).getTime() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');

      const statusMap: Record<string, string> = {
        DRAFT: 'Pendente',
        APPROVED: 'Aceito',
        CONVERTED: 'Convertido',
      };
      const status = statusMap[estimate.status] || estimate.status || 'Pendente';

      const companyName = tenant?.name || process.env.COMPANY_NAME || 'Oficina Mecânica';
      const companyDocument = tenant?.documentNumber || process.env.COMPANY_DOCUMENT || '00.000.000/0001-00';
      const companyPhone = tenant?.phone || process.env.COMPANY_PHONE || '(11) 1234-5678';
      const companyEmail = tenant?.email || process.env.COMPANY_EMAIL || 'contato@oficina.com';
      const logoUrl = tenant?.logoUrl || process.env.LOGO_URL || '';

      // Carrega o template (fallback inline se não encontrar)
      let templateContent: string;
      const templatePath = path.join(__dirname, 'estimates-pdf.hbs');
      try {
        templateContent = await readFile(templatePath, 'utf-8');
        this.logger.log(`Template carregado de ${templatePath}`);
      } catch (err) {
        this.logger.warn(`Template não encontrado em ${templatePath}, usando fallback inline.`);
        templateContent = `<!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"><title>Orçamento #{{estimateNumber}}</title>
        <style>
          body { font-family: 'Segoe UI', 'Arial', sans-serif; margin: 0; padding: 20px; background: #fff; color: #333; line-height: 1.5; }
          .container { max-width: 1000px; margin: 0 auto; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden; }
          .content { padding: 30px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0077ff; padding-bottom: 20px; margin-bottom: 25px; }
          .logo { max-height: 70px; max-width: 200px; }
          .company-info { text-align: right; font-size: 12px; color: #555; }
          .company-info h2 { margin: 0 0 5px; color: #0077ff; font-size: 18px; font-weight: 600; }
          .company-info p { margin: 2px 0; }
          .title-section { text-align: center; margin-bottom: 25px; }
          .title-section h1 { font-size: 28px; color: #0077ff; margin: 0; letter-spacing: -0.5px; }
          .status { display: inline-block; background: #e6f4ff; color: #0077ff; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 8px; }
          .client-box { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #0077ff; }
          .client-box h3 { margin: 0 0 15px; color: #0077ff; font-size: 18px; font-weight: 600; }
          .client-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .client-details p { margin: 0; font-size: 14px; }
          .client-details strong { color: #0077ff; font-weight: 600; }
          .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; background: #fff; padding: 0; }
          .info-block { background: #f9f9f9; padding: 15px; border-radius: 8px; width: 48%; }
          .info-block h4 { margin: 0 0 10px; color: #0077ff; font-size: 16px; font-weight: 600; }
          .info-block p { margin: 5px 0; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #f0f7ff; color: #0077ff; padding: 12px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #0077ff; }
          td { padding: 10px; border-bottom: 1px solid #e0e0e0; vertical-align: top; }
          .text-right { text-align: right; }
          .total-row { background-color: #f9f9f9; font-weight: bold; }
          .total-row td { border-top: 2px solid #0077ff; border-bottom: none; }
          .totals { text-align: right; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0; }
          .totals p { margin: 5px 0; font-size: 14px; }
          .grand-total { font-size: 18px; font-weight: bold; color: #0077ff; margin-top: 10px; }
          .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #888; border-top: 1px solid #eee; padding-top: 15px; }
          .observations { font-size: 12px; color: #666; margin-top: 20px; background: #fef9e6; padding: 12px; border-radius: 6px; }
        </style>
        </head>
        <body>
        <div class="container">
          <div class="content">
            <div class="header">
              <div class="logo">
                {{#if logoUrl}}<img src="{{logoUrl}}" alt="Logo" class="logo">{{else}}<div style="width:120px;height:60px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;border-radius:4px;"><span style="color:#999;">Logo</span></div>{{/if}}
              </div>
              <div class="company-info">
                <h2>{{companyName}}</h2>
                <p>{{companyDocument}}</p>
                <p>{{companyPhone}} | {{companyEmail}}</p>
              </div>
            </div>
            <div class="title-section">
              <h1>ORÇAMENTO Nº {{estimateNumber}}</h1>
              <span class="status">{{status}}</span>
            </div>
            <div class="client-box">
              <h3>Dados do Cliente</h3>
              <div class="client-details">
                <p><strong>Nome:</strong> {{client.name}}</p>
                <p><strong>Telefone:</strong> {{client.phone}}</p>
                <p><strong>Veículo:</strong> {{client.vehicle}}</p>
                <p><strong>Placa:</strong> {{client.plate}}</p>
                <p><strong>CPF/CNPJ:</strong> {{client.document}}</p>
                <p><strong>Endereço:</strong> {{client.address}}</p>
              </div>
            </div>
            <div class="invoice-info">
              <div class="info-block"><h4>Emissão</h4><p><strong>Data:</strong> {{issueDate}}</p><p><strong>Válido até:</strong> {{validUntil}}</p></div>
              <div class="info-block"><h4>Observações</h4><p>Orçamento válido por 10 dias. Após aprovação, será convertido em fatura.</p></div>
            </div>
               <table>
                <thead>
                  <tr><th>Descrição</th><th class="text-right">Qtd</th><th class="text-right">Valor Unit.</th><th class="text-right">ISS (%)</th><th class="text-right">Total (R$)</th></tr>
                </thead>
                <tbody>
                  {{#each items}}
                  <tr><td>{{this.description}}</td><td class="text-right">{{this.quantity}}</td><td class="text-right">{{this.unitPrice}}</td><td class="text-right">{{this.issPercent}}%</td><td class="text-right">{{this.total}}</td></tr>
                  {{/each}}
                </tbody>
               </table>
            <div class="totals">
              <p><strong>Subtotal:</strong> R$ {{subtotal}}</p>
              {{#if issValue}}<p><strong>ISS Total:</strong> R$ {{issValue}}</p>{{/if}}
              <div class="grand-total"><strong>TOTAL GERAL: R$ {{total}}</strong></div>
            </div>
            <div class="footer">
              <p>{{companyName}} - {{companyDocument}}</p>
              <p>{{companyPhone}} | {{companyEmail}}</p>
              <p>Documento gerado eletronicamente – válido sem assinatura.</p>
            </div>
          </div>
        </div>
        </body>
        </html>`;
      }

      const compiledTemplate = Handlebars.compile(templateContent);
      const data = {
        logoUrl,
        estimateNumber: estimate.id,
        client: {
          name: client.name,
          document: client.document || 'Não informado',
          address: client.address || 'Não informado',
          phone: client.phone,
          vehicle: vehicleDetails,
          plate,
        },
        issueDate,
        validUntil,
        status,
        items,
        subtotal: subtotal.toFixed(2),
        issValue: issTotal.toFixed(2),
        total: total.toFixed(2),
        companyName,
        companyDocument,
        companyPhone,
        companyEmail,
      };

      const html = compiledTemplate(data);
      const browser = await this.browserPool.getBrowser();
      const page = await browser.newPage();

      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      });
      await page.close();
      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error(`Erro ao gerar PDF do orçamento ${estimate.id}:`, error.stack);
      throw new InternalServerErrorException('Erro ao gerar PDF do orçamento. Verifique os logs.');
    }
  }
}