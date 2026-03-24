import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from '../payments/payment.service';
import { PrismaService } from '../shared/prisma/prisma.service';

@Controller('webhook')
export class WebhookController {
  constructor(
    private paymentService: PaymentService,
    private prisma: PrismaService,
  ) {}

  @Post('mercadopago')
  async mercadopagoWebhook(@Body() body: any) {
    console.log('Webhook recebido:', JSON.stringify(body, null, 2));

    const { type, data } = body;

    if (type === 'preapproval') {
      const subscription = await this.paymentService.getSubscription(data.id);

      if (subscription.status === 'authorized') {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 30);

        await this.prisma.pendingSubscription.upsert({
          where: { email: subscription.payer_email },
          update: {
            subscriptionId: subscription.id,
            planId: subscription.preapproval_plan_id,
            trialEndsAt,
          },
          create: {
            email: subscription.payer_email,
            subscriptionId: subscription.id,
            planId: subscription.preapproval_plan_id,
            trialEndsAt,
          },
        });

        console.log(`✅ Pendência criada para ${subscription.payer_email}`);
      }
    }

    if (type === 'payment') {
      const payment = await this.paymentService.getPayment(data.id);
      if (payment.status === 'approved' && payment.payer?.email) {
        console.log(`✅ Pagamento aprovado para ${payment.payer.email}`);
      }
    }

    return { received: true };
  }
}