import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PaymentService {
  constructor(private configService: ConfigService) {}

  async createSubscription(email: string, planId: string) {
    const accessToken = this.configService.get('MP_ACCESS_TOKEN');

    const preapproval = {
      preapproval_plan_id: planId,
      payer_email: email,
      back_url: "https://www.mecpro.tec.br/cadastro?payment=success",
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

  async getSubscription(subscriptionId: string) {
    const accessToken = this.configService.get('MP_ACCESS_TOKEN');
    const response = await axios.get(
      `https://api.mercadopago.com/preapproval/${subscriptionId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data;
  }

  async getPayment(paymentId: string) {
    const accessToken = this.configService.get('MP_ACCESS_TOKEN');
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data;
  }
}