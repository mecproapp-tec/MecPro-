import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { PaymentsModule } from '../payments/payments.module';
import { PrismaService } from '../shared/prisma/prisma.service';

@Module({
  imports: [PaymentsModule],
  controllers: [WebhookController],
  providers: [PrismaService],
})
export class WebhookModule {}