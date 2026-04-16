import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentService {
  // =========================
  // MERCADO PAGO - ASSINATURAS
  // =========================

  async getSubscription(preapprovalId: string): Promise<any> {
    // Mock para desenvolvimento
    return {
      id: preapprovalId,
      status: 'authorized',
      next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      external_reference: 'pending_sub_id',
      payer_email: 'cliente@exemplo.com',
      preapproval_plan_id: 'PLANO_BASICO',
    };
  }

  /**
   * Cria um link de assinatura no Mercado Pago
   * @param params - Dados da assinatura
   * @returns URL de checkout
   */
  async createSubscriptionLink(params: {
    externalReference: string;
    payerEmail: string;
    planId: string;
  }): Promise<string> {
    // Mock - em produção, integraria com a API do Mercado Pago
    console.log('Criando link de assinatura:', params);
    const mockUrl = `https://sandbox.mercadopago.com.br/checkout?preapproval_id=${params.externalReference}`;
    return mockUrl;
  }

  /**
   * Obtém dados de um pagamento único
   * @param paymentId - ID do pagamento no gateway
   */
  async getPayment(paymentId: string): Promise<any> {
    // Mock - em produção, buscaria do Mercado Pago
    return {
      id: paymentId,
      status: 'approved',
      payer: {
        email: 'cliente@exemplo.com',
      },
    };
  }

  /**
   * Alias para getPayment (caso algum serviço use getPaymentById)
   */
  async getPaymentById(paymentId: string): Promise<any> {
    return this.getPayment(paymentId);
  }

  /**
   * Alias para createSubscriptionLink (caso algum serviço use createCheckoutLink)
   */
  async createCheckoutLink(params: {
    externalReference: string;
    payerEmail: string;
    planId: string;
  }): Promise<string> {
    return this.createSubscriptionLink(params);
  }
}