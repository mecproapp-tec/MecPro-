import { Module } from '@nestjs/common';
import { InvoicesController, PublicInvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoicesPdfService } from './invoices-pdf.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, WhatsappModule],
  controllers: [InvoicesController, PublicInvoicesController],
  providers: [InvoicesService, InvoicesPdfService],
  exports: [InvoicesService],
})
export class InvoicesModule {}