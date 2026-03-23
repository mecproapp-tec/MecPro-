import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PaymentService {
  constructor(private configService: ConfigService) {}

  // Cria uma pré-aprovação (assinatura) usando o ID do plano
  async createSubscription(email: string, planId: string) {
    const accessToken = this.configService.get('MP_ACCESS_TOKEN');

    const preapproval = {
      preapproval_plan_id: planId,
      payer_email: email,
      back_url: "https://app.mecpro.tec.br/cadastro?payment=success",
      status: "pending"
    };

    try {
      const response = await axios.post(
        'https://api.mercadopago.com/preapproval',
        preapproval,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return { checkoutUrl: response.data.init_point };
    } catch (error) {
      console.error('Erro ao criar preapproval:', error.response?.data);
      throw new Error('Falha ao iniciar assinatura');
    }
  }

  // Consulta uma assinatura pelo ID
  async getSubscription(subscriptionId: string) {
    const accessToken = this.configService.get('MP_ACCESS_TOKEN');
    const response = await axios.get(
      `https://api.mercadopago.com/preapproval/${subscriptionId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data;
  }

  // Consulta um pagamento pelo ID
  async getPayment(paymentId: string) {
    const accessToken = this.configService.get('MP_ACCESS_TOKEN');
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data;
  }
}