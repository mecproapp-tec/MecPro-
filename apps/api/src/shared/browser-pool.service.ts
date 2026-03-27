import { Injectable, OnApplicationShutdown, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class BrowserPoolService implements OnApplicationShutdown {
  private browser: puppeteer.Browser | null = null;
  private readonly logger = new Logger(BrowserPoolService.name);

  async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.logger.log('Iniciando navegador Puppeteer...');
      this.browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      });
    }
    return this.browser;
  }

  async onApplicationShutdown(signal?: string) {
    if (this.browser) {
      this.logger.log('Fechando navegador Puppeteer...');
      await this.browser.close();
    }
  }
}