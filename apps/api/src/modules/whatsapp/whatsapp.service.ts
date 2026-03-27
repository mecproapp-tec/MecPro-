import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  generateWhatsAppLink(phone: string, message: string): string {
    // limpa telefone
    const cleanPhone = phone.replace(/\D/g, '');

    // garante código do Brasil
    const formattedPhone = cleanPhone.startsWith('55')
      ? cleanPhone
      : `55${cleanPhone}`;

    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  }
}