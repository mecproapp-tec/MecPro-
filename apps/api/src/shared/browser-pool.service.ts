import { Injectable, OnApplicationShutdown, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class BrowserPoolService implements OnApplicationShutdown {
  private browser: puppeteer.Browser | null = null;
  private readonly logger = new Logger(BrowserPoolService.name);

  async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.logger.log('Iniciando navegador Puppeteer...');
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      const launchOptions: puppeteer.LaunchOptions = {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      };
      if (executablePath) {
        launchOptions.executablePath = executablePath;
        this.logger.log(`Usando Chromium customizado em: ${executablePath}`);
      } else {
        this.logger.log('Usando Chromium padrão do Puppeteer');
      }
      this.browser = await puppeteer.launch(launchOptions);
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
