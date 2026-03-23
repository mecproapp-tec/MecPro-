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

        // Cria ou atualiza a assinatura pendente
        await this.prisma.pendingSubscription.upsert({
          where: { email: subscription.payer_email },
          update: {
            subscriptionId: subscription.id,
            planId: subscription.preapproval_plan_id,
            trialEndsAt: trialEndsAt,
          },
          create: {
            email: subscription.payer_email,
            subscriptionId: subscription.id,
            planId: subscription.preapproval_plan_id,
            trialEndsAt: trialEndsAt,
          },
        });

        console.log(`✅ Assinatura pendente registrada para ${subscription.payer_email}`);
      } else if (subscription.status === 'cancelled') {
        // Remove pendência se cancelada
        await this.prisma.pendingSubscription.deleteMany({
          where: { subscriptionId: subscription.id },
        });
      }
    }

    if (type === 'payment') {
      const payment = await this.paymentService.getPayment(data.id);
      if (payment.status === 'approved' && payment.payer?.email) {
        // Aqui você pode, futuramente, atualizar o tenant se ele já existir
        console.log(`✅ Pagamento aprovado para ${payment.payer.email}`);
      }
    }

    return { received: true };
  }
}