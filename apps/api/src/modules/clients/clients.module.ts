import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ClientsController],
  providers: [PrismaService, ClientsService], // ✅ injeta PrismaService diretamente
  exports: [ClientsService],
})
export class ClientsModule {}