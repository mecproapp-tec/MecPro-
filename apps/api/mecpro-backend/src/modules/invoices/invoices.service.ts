import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import * as path from 'path';
import * as fs from 'fs/promises';
import { randomBytes } from 'crypto';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class InvoicesService {
  constructor(
  private prisma: PrismaService,
  private whatsappService: WhatsappService,
  private configService: ConfigService,
) {}

  async create(tenantId: string, data: {
    clientId: number;
    items: { description: string; quantity: number; price: number; issPercent: number }[];
    status?: 'PENDING' | 'PAID' | 'CANCELED';
  }) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('A fatura deve ter pelo menos um item.');
    }
    for (const item of data.items) {
      if (item.quantity <= 0 || item.price < 0) {
        throw new BadRequestException('Item inválido: quantidade ou preço incorretos.');
      }
    }

    const client = await this.prisma.client.findFirst({
      where: { id: data.clientId, tenantId },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const itemsWithTotal = data.items.map(item => {
      const iss = item.issPercent ? item.price * (item.issPercent / 100) : 0;
      const total = (item.price + iss) * item.quantity;
      return {
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        issPercent: item.issPercent,
        total,
      };
    });

    const total = itemsWithTotal.reduce((acc, item) => acc + item.total, 0);
    const invoiceNumber = `INV-${uuidv4().slice(0, 8).toUpperCase()}`;

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        clientId: data.clientId,
        number: invoiceNumber,
        total,
        status: data.status || 'PENDING',
        items: {
          create: itemsWithTotal,
        },
      },
      include: { items: true, client: true },
    });

    return invoice;
  }

  async findAll(tenantId: string) {
    return this.prisma.invoice.findMany({
      where: { tenantId },
      include: { items: true, client: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, tenantId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: { items: true, client: true },
    });
    if (!invoice) throw new NotFoundException('Fatura não encontrada');
    return invoice;
  }

  async update(id: number, tenantId: string, data: {
    clientId: number;
    items: { description: string; quantity: number; price: number; issPercent: number }[];
    status?: 'PENDING' | 'PAID' | 'CANCELED';
  }) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('A fatura deve ter pelo menos um item.');
    }
    for (const item of data.items) {
      if (item.quantity <= 0 || item.price < 0) {
        throw new BadRequestException('Item inválido: quantidade ou preço incorretos.');
      }
    }

    await this.findOne(id, tenantId);
    await this.prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

    const itemsWithTotal = data.items.map(item => {
      const iss = item.issPercent ? item.price * (item.issPercent / 100) : 0;
      const total = (item.price + iss) * item.quantity;
      return {
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        issPercent: item.issPercent,
        total,
      };
    });

    const total = itemsWithTotal.reduce((acc, item) => acc + item.total, 0);

    return this.prisma.invoice.update({
      where: { id },
      data: {
        clientId: data.clientId,
        total,
        status: data.status || 'PENDING',
        items: {
          create: itemsWithTotal,
        },
      },
      include: { items: true, client: true },
    });
  }

  async remove(id: number, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await this.prisma.invoice.delete({ where: { id } });
    return { message: 'Fatura removida com sucesso' };
  }

  private async generatePdfFromInvoice(invoice: any, tenant: any): Promise<Buffer> {
    const items = invoice.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.price.toFixed(2),
      total: item.total.toFixed(2),
    }));

    const subtotal = invoice.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const issValue = invoice.items.reduce((acc, item) => {
      const iss = item.issPercent ? item.price * (item.issPercent / 100) * item.quantity : 0;
      return acc + iss;
    }, 0);
    const issRate = invoice.items[0]?.issPercent || 0;

    const issueDate = new Date(invoice.createdAt).toLocaleDateString('pt-BR');
    const dueDate = new Date(new Date(invoice.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');

    const statusMap = {
      PENDING: 'Pendente',
      PAID: 'Pago',
      CANCELED: 'Cancelado',
    };

    const clientDoc = invoice.client['document'] || 'Não informado';
    const clientAddress = invoice.client['address'] || 'Não informado';

    const companyName = tenant?.name || 'Oficina Mecânica';
    const companyDocument = tenant?.['documentNumber'] || tenant?.['document'] || '00.000.000/0001-00';
    const companyPhone = tenant?.phone || '(11) 1234-5678';
    const companyEmail = tenant?.email || 'contato@oficina.com';
    const logoUrl = tenant?.logoUrl || 'https://via.placeholder.com/150x80?text=Logo';

    const templatePath = path.join(__dirname, 'invoice-pdf.hbs');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateContent);

    const html = compiledTemplate({
      logoUrl,
      invoiceNumber: invoice.number,
      client: {
        name: invoice.client.name,
        document: clientDoc,
        address: clientAddress,
        phone: invoice.client.phone,
      },
      issueDate,
      dueDate,
      status: statusMap[invoice.status] || invoice.status,
      items,
      subtotal: subtotal.toFixed(2),
      issRate,
      issValue: issValue.toFixed(2),
      total: invoice.total.toFixed(2),
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

  async generatePdf(id: number, tenantId: string): Promise<Buffer> {
    const invoice = await this.findOne(id, tenantId);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    return this.generatePdfFromInvoice(invoice, tenant);
  }

  async generateShareToken(id: number, tenantId: string): Promise<string> {
    const invoice = await this.findOne(id, tenantId);
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias de validade

    await this.prisma.invoice.update({
      where: { id },
      data: {
        shareToken: token,
        shareTokenExpires: expiresAt,
      },
    });

    return token;
  }

  async validateShareToken(token: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { shareToken: token },
      include: { items: true, client: true },
    });
    if (!invoice) {
      throw new UnauthorizedException('Token inválido');
    }
    if (invoice.shareTokenExpires && new Date() > invoice.shareTokenExpires) {
      throw new UnauthorizedException('Token expirado');
    }
    return invoice;
  }

  async getPdfByShareToken(token: string): Promise<Buffer> {
    const invoice = await this.validateShareToken(token);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: invoice.tenantId },
    });
    return this.generatePdfFromInvoice(invoice, tenant);
  }

async sendViaWhatsApp(
  id: number,
  tenantId: string,
): Promise<{ whatsappLink: string; message: string; pdfUrl: string }> {
  const invoice = await this.findOne(id, tenantId);
  const client = invoice.client;

  if (!client.phone) {
    throw new BadRequestException('Cliente não possui telefone cadastrado');
  }

  const token = await this.generateShareToken(id, tenantId);

  const baseUrl =
    this.configService.get<string>('APP_URL')?.replace(/\/$/, '') ||
    'http://localhost:3000';

  const pdfUrl = `${baseUrl}/api/public/invoices/share/${token}`;

  const message = `Olá ${client.name}, sua fatura ${invoice.number} está disponível!

📄 Link do PDF:
${pdfUrl}

💰 Valor: R$ ${invoice.total.toFixed(2)}
📅 Data: ${new Date(invoice.createdAt).toLocaleDateString('pt-BR')}
📌 Status: ${invoice.status}`;

  const whatsappLink = this.whatsappService.generateWhatsAppLink(
    client.phone,
    message,
  );

  return {
    whatsappLink,
    message,
    pdfUrl,
  };
}
}