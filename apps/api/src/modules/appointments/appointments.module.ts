import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AppointmentsController],
  providers: [PrismaService, AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}