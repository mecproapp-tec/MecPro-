import { Body, Controller, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentService: PaymentService,
    private configService: ConfigService,
  ) {}

  // Endpoint para criar uma assinatura (chamado pelo frontend)
  @Post('subscription')
  async createSubscription(@Body() body: { email: string; planId: string }) {
    return this.paymentService.createSubscription(body.email, body.planId);
  }

  // Endpoint administrativo para criar o plano com trial de 30 dias (executar apenas uma vez)
  @Post('create-plan')
  async createPlan() {
    const accessToken = this.configService.get('MP_ACCESS_TOKEN');

    const planData = {
      reason: "Assinatura MecPro - 30 dias grátis",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 149.90,
        currency_id: "BRL",
        free_trial: {
          frequency: 30,
          frequency_type: "days"
        }
      },
      payment_methods_allowed: {
        payment_types: [
          { id: "credit_card" },
          { id: "debit_card" }
        ]
      },
      back_url: "https://app.mecpro.tec.br/cadastro?payment=success"
    };

    try {
      const response = await axios.post(
        'https://api.mercadopago.com/preapproval_plan',
        planData,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      console.log('✅ Plano criado:', response.data.id);
      return { planId: response.data.id, init_point: response.data.init_point };
    } catch (error) {
      console.error('Erro ao criar plano:', error.response?.data || error);
      throw error;
    }
  }
}