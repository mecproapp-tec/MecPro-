// apps/api/src/modules/public-share/public-share.module.ts
import { Module } from '@nestjs/common';
import { PublicShareService } from './public-share.service';
import { PublicShareController } from './public-share.controller';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Module({
  providers: [PublicShareService, PrismaService],
  controllers: [PublicShareController],
  exports: [PublicShareService],
})
export class PublicShareModule {}