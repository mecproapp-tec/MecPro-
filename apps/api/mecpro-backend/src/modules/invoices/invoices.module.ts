import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController, PublicInvoicesController } from './invoices.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module'; // importe
import { ConfigModule } from '@nestjs/config'; // importe se necessário

@Module({
  imports: [PrismaModule, AuthModule, WhatsappModule, ConfigModule], // adicione
  controllers: [InvoicesController, PublicInvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}