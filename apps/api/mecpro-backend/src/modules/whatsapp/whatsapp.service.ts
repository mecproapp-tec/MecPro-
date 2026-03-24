import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsappService {
  constructor(private configService: ConfigService) {}

  /**
   * Formata o número de telefone para o padrão internacional (código do país + DDD + número)
   * @param phone Número do telefone (pode conter formatação)
   * @returns Número formatado (apenas dígitos) com código do país, se aplicável
   */
  formatPhoneNumber(phone: string): string {
    // Remove tudo que não é dígito
    const clean = phone.replace(/\D/g, '');

    // Se o número tiver 11 dígitos (ex: 1199999999) e não começar com 55, adiciona 55
    if (clean.length === 11 && !clean.startsWith('55')) {
      return `55${clean}`;
    }

    // Se já começar com 55 ou tiver outro formato, retorna limpo
    return clean;
  }

  /**
   * Gera um link do WhatsApp com mensagem pré-preenchida
   * @param phone Número do telefone (com DDD, apenas números)
   * @param message Mensagem codificada para URL
   * @returns URL do WhatsApp
   */
  generateWhatsAppLink(phone: string, message: string): string {
    const fullPhone = this.formatPhoneNumber(phone);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${fullPhone}?text=${encodedMessage}`;
  }

  /**
   * Envia mensagem via API oficial (placeholder - implementar depois)
   */
  async sendMessage(phone: string, message: string, pdfUrl?: string) {
    // Aqui futuramente integrar com API do WhatsApp Business
    throw new Error('Método não implementado. Use generateWhatsAppLink por enquanto.');
  }
}