import { Body, Controller, Post } from '@nestjs/common'
import { PaymentService } from './payment.service'

@Controller('payments')
export class PaymentsController {

  constructor(private paymentService: PaymentService) {}

  @Post('subscription')
  async createSubscription(@Body() body: { email: string }) {

    return this.paymentService.createSubscription(body.email)

  }

}