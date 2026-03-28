import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { writeFile, mkdir, access, readFile } from 'fs/promises';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly basePath: string;

  constructor(private configService: ConfigService) {
    this.basePath = this.configService.get('LOCAL_STORAGE_PATH') || '/app/uploads';
    this.init().catch(err => this.logger.error('Falha ao criar diretório de uploads', err));
  }

  private async init() {
    try {
      await access(this.basePath);
      this.logger.log(`Diretório de uploads já existe: ${this.basePath}`);
    } catch {
      await mkdir(this.basePath, { recursive: true });
      this.logger.log(`Diretório de uploads criado: ${this.basePath}`);
    }
  }

  async upload(buffer: Buffer, key: string): Promise<string> {
    try {
      const fullPath = join(this.basePath, key);
      const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
      await mkdir(dir, { recursive: true });
      await writeFile(fullPath, buffer);
      this.logger.log(`Arquivo salvo localmente: ${fullPath}`);
      return key; // retorna a chave (caminho relativo) para referência
    } catch (error) {
      this.logger.error(`Erro ao salvar arquivo localmente: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao salvar PDF');
    }
  }

  async get(key: string): Promise<Buffer> {
    try {
      const fullPath = join(this.basePath, key);
      const buffer = await readFile(fullPath);
      this.logger.log(`Arquivo lido localmente: ${fullPath}`);
      return buffer;
    } catch (error) {
      this.logger.error(`Erro ao ler arquivo local: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao recuperar PDF');
    }
  }
}