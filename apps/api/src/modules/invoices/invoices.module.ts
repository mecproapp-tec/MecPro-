import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoicesPdfService } from './invoices-pdf.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule], // ✅ simplificado, sem módulos não utilizados
  controllers: [InvoicesController],
  providers: [
    PrismaService,
    InvoicesService,
    InvoicesPdfService,
    StorageService,
  ],
  exports: [InvoicesService, InvoicesPdfService],
})
export class InvoicesModule {}