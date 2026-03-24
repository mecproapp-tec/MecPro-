import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class PaymentService {

  constructor(private configService: ConfigService) {}

  async createSubscription(email: string) {

    console.log("Criando assinatura para:", email)

    const accessToken = this.configService.get('MP_ACCESS_TOKEN')

    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() + 1) // 1 mês grátis

    const subscription = {
      reason: "Assinatura MecPro",
      payer_email: email,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 149.90,
        currency_id: "BRL"
      },
      back_url: "https://google.com",
      status: "pending",
      start_date: startDate.toISOString()
    }

    try {

      const response = await fetch(
        "https://api.mercadopago.com/preapproval",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
          },
          body: JSON.stringify(subscription)
        }
      )

      const data = await response.json()

      console.log("Resposta Mercado Pago:", data)

      return {
        url: data.init_point || data.sandbox_init_point
      }

    } catch (error) {

      console.error("Erro Mercado Pago:", error)

      return {
        error: "Erro ao criar assinatura"
      }

    }

  }

  async processPayment(paymentId: string) {

    console.log("Pagamento recebido:", paymentId)

    return {
      status: "ok"
    }

  }

}