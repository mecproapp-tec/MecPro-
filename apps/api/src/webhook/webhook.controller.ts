// src/webhook/webhook.controller.ts
import { Controller, Post, Body, Headers, BadRequestException, Logger } from '@nestjs/common';
import { PaymentService } from '../payments/payment.service';
import { PrismaService } from '../shared/prisma/prisma.service';
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private paymentService: PaymentService,
    private prisma: PrismaService,
  ) {}

  @Post('mercadopago')
  async mercadopagoWebhook(
    @Body() body: any,
    @Headers('x-signature') signature: string,
  ) {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (secret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('hex');
      if (signature !== expectedSignature) {
        this.logger.warn('Assinatura inválida, ignorando webhook');
        throw new BadRequestException('Assinatura inválida');
      }
    }

    this.logger.log(`Webhook recebido: ${JSON.stringify(body)}`);

    const { type, data } = body;

    if (type === 'preapproval') {
      try {
        const mpSubscription: any = await this.paymentService.getSubscription(data.id);

        let pendingSub = null;
        if (mpSubscription.external_reference) {
          pendingSub = await this.prisma.pendingSubscription.findUnique({
            where: { id: mpSubscription.external_reference },
          });
        }
        if (!pendingSub && mpSubscription.payer_email) {
          pendingSub = await this.prisma.pendingSubscription.findFirst({
            where: { email: mpSubscription.payer_email, status: 'pending' },
          });
        }

        if (!pendingSub) {
          this.logger.warn(`Nenhum pendingSubscription encontrado para assinatura: ${mpSubscription.id}`);
          return { received: true };
        }

        let tenant = null;
        if (pendingSub.tenantId) {
          tenant = await this.prisma.tenant.findUnique({
            where: { id: pendingSub.tenantId },
          });
        }
        if (!tenant && pendingSub.email) {
          tenant = await this.prisma.tenant.findFirst({
            where: { email: pendingSub.email },
          });
        }

        if (!tenant) {
          this.logger.warn(`Tenant não encontrado para pendingSubscription: ${pendingSub.id}`);
          return { received: true };
        }

        let tenantStatus: 'ACTIVE' | 'BLOCKED' | 'CANCELED' = 'BLOCKED';
        let paymentStatus = 'expired';
        let subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' = 'CANCELED';

        switch (mpSubscription.status) {
          case 'authorized':
            tenantStatus = 'ACTIVE';
            paymentStatus = 'paid';
            subscriptionStatus = 'ACTIVE';
            break;
          case 'paused':
            tenantStatus = 'BLOCKED';
            paymentStatus = 'overdue';
            subscriptionStatus = 'PAST_DUE';
            break;
          case 'cancelled':
            tenantStatus = 'CANCELED';
            paymentStatus = 'canceled';
            subscriptionStatus = 'CANCELED';
            break;
          default:
            tenantStatus = 'BLOCKED';
            paymentStatus = 'pending';
            subscriptionStatus = 'PAST_DUE';
        }

        await this.prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            subscriptionId: mpSubscription.id,
            status: tenantStatus,
            paymentStatus,
            trialEndsAt: mpSubscription.next_payment_date
              ? new Date(mpSubscription.next_payment_date)
              : null,
          },
        });

        // CORRIGIDO: subscriptions -> subscription
        const existingSub = await this.prisma.subscription.findFirst({
          where: { tenantId: tenant.id },
        });

        const subscriptionData: any = {
          gatewaySubscriptionId: mpSubscription.id,
          status: subscriptionStatus,
          endDate: mpSubscription.next_payment_date
            ? new Date(mpSubscription.next_payment_date)
            : null,
        };

        if (existingSub) {
          // CORRIGIDO: subscriptions -> subscription
          await this.prisma.subscription.update({
            where: { id: existingSub.id },
            data: subscriptionData,
          });
        } else {
          // CORRIGIDO: subscriptions -> subscription, removido as any
          await this.prisma.subscription.create({
            data: {
              id: randomUUID(),
              tenantId: tenant.id,
              planName: mpSubscription.preapproval_plan_id || 'PLANO_BASICO',
              price: 0,
              status: subscriptionStatus,
              gateway: 'MERCADOPAGO',
              gatewaySubscriptionId: mpSubscription.id,
              startDate: new Date(),
              endDate: mpSubscription.next_payment_date
                ? new Date(mpSubscription.next_payment_date)
                : null,
            },
          });
        }

        await this.prisma.pendingSubscription.update({
          where: { id: pendingSub.id },
          data: {
            subscriptionId: mpSubscription.id,
            planId: mpSubscription.preapproval_plan_id,
            status: 'paid',
          },
        });

        this.logger.log(`Tenant ${tenant.id} atualizado: status=${tenantStatus}, payment=${paymentStatus}`);
      } catch (error) {
        this.logger.error(`Erro ao processar webhook de assinatura: ${error.message}`);
      }
    }

    if (type === 'payment') {
      try {
        const payment: any = await this.paymentService.getPayment(data.id);
        if (payment.status === 'approved' && payment.payer?.email) {
          this.logger.log(`Pagamento aprovado para ${payment.payer.email}`);
        }
      } catch (error) {
        this.logger.error(`Erro ao processar webhook de pagamento: ${error.message}`);
      }
    }

    return { received: true };
  }
}