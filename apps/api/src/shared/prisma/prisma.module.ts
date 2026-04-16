import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 🔥 ISSO AQUI
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}