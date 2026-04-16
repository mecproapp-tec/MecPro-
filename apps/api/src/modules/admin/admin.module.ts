import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { InvoicesModule } from '../invoices/invoices.module';
import { EstimatesModule } from '../estimates/estimates.module';

@Module({
  imports: [
    InvoicesModule,
    EstimatesModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}