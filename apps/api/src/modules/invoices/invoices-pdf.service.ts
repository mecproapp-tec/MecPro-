// apps/api/src/modules/invoices/invoices-pdf.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import puppeteer from 'puppeteer';

@Injectable()
export class InvoicesPdfService {
  constructor(private prisma: PrismaService) {}

  async getPdfByShareToken(token: string): Promise<Buffer> {
    // Buscar a fatura pelo token de compartilhamento
    const invoice = await this.prisma.invoice.findFirst({
      where: { shareToken: token },
      include: {
        items: true,
        client: true,
      },
    });

    if (!invoice) {
      throw new Error('Fatura não encontrada');
    }

    // Calcular subtotal e ISS com base nos itens
    let subtotal = 0;
    let issTotal = 0;
    const itemsWithTotal = invoice.items.map(item => {
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

    // Carregar o template
    const templatePath = path.join(__dirname, 'invoice-pdf.hbs');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateContent);

    // Dados do cliente incluindo veículo e placa
    const clientVehicle = invoice.client['vehicle'] || 'Não informado';
    const clientPlate = invoice.client['plate'] || 'Não informado';

    // Dados para o template
    const data = {
      invoiceNumber: invoice.number,
      client: {
        name: invoice.client.name,
        document: invoice.client.document || 'Não informado',
        address: invoice.client.address || '',
        phone: invoice.client.phone,
        vehicle: clientVehicle,
        plate: clientPlate,
      },
      issueDate: new Date(invoice.createdAt).toLocaleDateString('pt-BR'),
      dueDate: '',
      status: invoice.status === 'PAID' ? 'Paga' : invoice.status === 'PENDING' ? 'Pendente' : 'Cancelada',
      items: itemsWithTotal,
      subtotal: subtotal.toFixed(2),
      issRate: 0,
      issValue: issTotal.toFixed(2),
      total: total.toFixed(2),
      companyName: process.env.COMPANY_NAME || 'Oficina',
      companyDocument: process.env.COMPANY_DOCUMENT || '',
      companyPhone: process.env.COMPANY_PHONE || '',
      companyEmail: process.env.COMPANY_EMAIL || '',
      logoUrl: process.env.LOGO_URL || '',
    };

    const html = template(data);

    // Gerar PDF com Puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfUint8 = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    return Buffer.from(pdfUint8);
  }
}