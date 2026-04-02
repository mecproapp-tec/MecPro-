// C:\Users\admco\OneDrive\Escritorio\MecPro\apps\api\src\modules\storage\storage.service.ts

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    this.bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
    this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL!;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

    if (!this.bucket || !this.publicUrl || !accountId) {
      this.logger.error('Configuração do Cloudflare R2 incompleta. Verifique as variáveis de ambiente.');
      throw new InternalServerErrorException('Storage service misconfigured');
    }

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: endpoint,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });

    this.logger.log(`StorageService inicializado com bucket: ${this.bucket}`);
  }

  /**
   * Faz upload de um buffer PDF para o R2 e retorna a URL pública completa.
   * @param buffer Conteúdo do arquivo (PDF)
   * @param key Caminho/chave no bucket (ex: "tenantId/estimates/123.pdf")
   * @returns URL pública completa (ex: https://pub-....r2.dev/tenantId/estimates/123.pdf)
   */
  async upload(buffer: Buffer, key: string): Promise<string> {
    if (!buffer || buffer.length === 0) {
      throw new Error('Buffer inválido ou vazio');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf',
      });

      await this.s3.send(command);
      this.logger.log(`Upload concluído com sucesso: ${key}`);
      return `${this.publicUrl}/${key}`;
    } catch (error) {
      // Log detalhado do erro para diagnóstico
      this.logger.error(`Falha no upload para key ${key}:`);
      if (error instanceof Error) {
        this.logger.error(`  Mensagem: ${error.message}`);
        this.logger.error(`  Nome do erro: ${error.name}`);
        if (error.stack) this.logger.error(`  Stack trace: ${error.stack}`);
      } else {
        this.logger.error(`  Erro desconhecido: ${JSON.stringify(error)}`);
      }
      throw new InternalServerErrorException(
        `Erro ao salvar arquivo no storage: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }

  /**
   * Recupera um arquivo do R2, aceitando tanto a chave quanto a URL pública completa.
   * @param keyOrUrl Chave (ex: "tenant/123.pdf") ou URL pública completa
   * @returns Buffer do arquivo
   */
  async get(keyOrUrl: string): Promise<Buffer> {
    let key = keyOrUrl;
    if (keyOrUrl.startsWith(this.publicUrl)) {
      key = keyOrUrl.replace(this.publicUrl + '/', '');
    }

    try {
      const response = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      const stream = response.Body as any;
      if (!stream) {
        throw new Error('Resposta do R2 sem corpo');
      }

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (err: Error) => reject(err));
      });
    } catch (error) {
      this.logger.error(`Erro ao obter arquivo ${key}: ${error instanceof Error ? error.message : String(error)}`);
      throw new InternalServerErrorException(`Arquivo não encontrado no storage: ${key}`);
    }
  }

  /**
   * Gera uma URL assinada (válida por 1 hora) para acesso temporário.
   * Útil se o bucket não for público.
   * @param key Chave do objeto
   * @returns URL assinada
   */
  async getSignedUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const signedUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
      return signedUrl;
    } catch (error) {
      this.logger.error(`Erro ao gerar URL assinada para ${key}: ${error instanceof Error ? error.message : String(error)}`);
      throw new InternalServerErrorException('Erro ao gerar link temporário');
    }
  }
}