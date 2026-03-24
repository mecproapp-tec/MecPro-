import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class EstimatesPdfService {
  async generateEstimatePdf(estimate: any, tenant: any): Promise<Buffer> {
    const items = estimate.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.price.toFixed(2),
      issPercent: item.issPercent || 0,
      total: item.total.toFixed(2),
    }));

    const subtotal = estimate.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const issValue = estimate.items.reduce((acc, item) => {
      const iss = item.issPercent ? item.price * (item.issPercent / 100) * item.quantity : 0;
      return acc + iss;
    }, 0);

    const issueDate = new Date(estimate.date).toLocaleDateString('pt-BR');
    const validUntil = new Date(new Date(estimate.date).getTime() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');

    // ✅ Status em português conforme frontend
    const statusMap: Record<string, string> = {
      DRAFT: 'Pendente',
      APPROVED: 'Aceito',
      CONVERTED: 'Convertido',
    };

    const clientDoc = estimate.client['document'] || 'Não informado';
    const clientAddress = estimate.client['address'] || 'Não informado';
    const clientVehicle = estimate.client['vehicle'] || 'Não informado';
    const clientPlate = estimate.client['plate'] || 'Não informado';

    const companyName = tenant?.name || 'Oficina Mecânica';
    const companyDocument = tenant?.['documentNumber'] || tenant?.['document'] || '00.000.000/0001-00';
    const companyPhone = tenant?.phone || '(11) 1234-5678';
    const companyEmail = tenant?.email || 'contato@oficina.com';
    const logoUrl = tenant?.logoUrl || 'https://via.placeholder.com/150x80?text=Logo';

    const templatePath = path.join(__dirname, 'estimates-pdf.hbs');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateContent);

    const html = compiledTemplate({
      logoUrl,
      estimateNumber: estimate.id,
      client: {
        name: estimate.client.name,
        document: clientDoc,
        address: clientAddress,
        phone: estimate.client.phone,
        vehicle: clientVehicle,
        plate: clientPlate,
      },
      issueDate,
      validUntil,
      status: statusMap[estimate.status] || estimate.status,
      items,
      subtotal: subtotal.toFixed(2),
      issValue: issValue.toFixed(2),
      total: estimate.total.toFixed(2),
      companyName,
      companyDocument,
      companyPhone,
      companyEmail,
    });

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px',
      },
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  }
}