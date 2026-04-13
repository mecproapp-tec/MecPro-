// apps/api/src/modules/estimates/estimates.module.ts
import { Module } from '@nestjs/common';
import { EstimatesController } from './estimates.controller';
import { EstimatesService } from './estimates.service';
import { EstimatesPdfService } from './estimates-pdf.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [EstimatesController],
  providers: [
    PrismaService,
    EstimatesService,
    EstimatesPdfService,
    StorageService,
  ],
  exports: [EstimatesService, EstimatesPdfService],
})
export class EstimatesModule {}