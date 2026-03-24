import { Module } from '@nestjs/common';
import { EstimatesController, PublicEstimatesController } from './estimates.controller';
import { EstimatesService } from './estimates.service';
import { EstimatesPdfService } from './estimates-pdf.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, WhatsappModule],
  controllers: [EstimatesController, PublicEstimatesController],
  providers: [EstimatesService, EstimatesPdfService],
  exports: [EstimatesService],
})
export class EstimatesModule {}