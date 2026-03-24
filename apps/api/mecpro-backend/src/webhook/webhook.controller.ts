import { Controller, Post, Query } from '@nestjs/common'
import { PaymentService } from '../payments/payment.service'

@Controller('webhook')
export class WebhookController {

  constructor(private paymentService: PaymentService) {}

  @Post('mercadopago')
  async mercadopagoWebhook(
    @Query('type') type: string,
    @Query('data.id') paymentId: string
  ) {

    console.log("Webhook recebido:", type, paymentId)

    if (type === 'payment') {

      await this.paymentService.processPayment(paymentId)

    }

    return { received: true }

  }

}