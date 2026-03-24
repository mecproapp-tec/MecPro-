import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { EstimatesModule } from '../estimates/estimates.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [EstimatesModule, InvoicesModule],
  controllers: [PublicController],
})
export class PublicModule {}