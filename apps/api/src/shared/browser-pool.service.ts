import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class BrowserPoolService implements OnModuleDestroy {
  private readonly logger = new Logger(BrowserPoolService.name);
  private browser: puppeteer.Browser | null = null;
  private isLaunching = false;

  async getBrowser(): Promise<puppeteer.Browser> {
    if (this.browser) return this.browser;

    if (this.isLaunching) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getBrowser();
    }

    this.isLaunching = true;
    try {
      this.browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      });
      this.logger.log('Browser launched');
      return this.browser;
    } finally {
      this.isLaunching = false;
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.logger.log('Browser closed');
    }
  }
}