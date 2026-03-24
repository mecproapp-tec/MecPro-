import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PaymentsController } from './payment.controller'
import { PaymentService } from './payment.service'

@Module({
  imports: [ConfigModule],
  controllers: [PaymentsController],
  providers: [PaymentService],
  exports: [PaymentService] // 👈 IMPORTANTE
})
export class PaymentModule {}