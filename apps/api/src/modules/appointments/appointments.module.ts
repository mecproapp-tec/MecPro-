import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module'; // Importa AuthModule
import { ConfigModule } from '@nestjs/config'; // Se necessário

@Module({
  imports: [
    PrismaModule,
    AuthModule, // fornece JwtService e ConfigService via exportação
    ConfigModule, // opcional, se AuthModule já exportar ConfigModule, mas não exporta, então inclua
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}