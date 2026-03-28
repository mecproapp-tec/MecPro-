process.env.TZ = 'America/Sao_Paulo';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
  });

  console.log('🚀 Iniciando aplicação...');
  console.log(`📦 NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`🔍 PORT env: ${process.env.PORT}`);
  console.log(`🔍 APP_URL env: ${process.env.APP_URL}`);

  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Lista de origens permitidas (pode vir de variável de ambiente)
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  // Origens padrão (inclui admin e portas de desenvolvimento)
  const defaultOrigins = [
    'https://www.mecpro.tec.br',
    'https://mecpro.tec.br',
    'https://admin.mecpro.tec.br',   // admin em produção
    'http://localhost:5173',          // web em desenvolvimento
    'http://localhost:5174',          // admin em desenvolvimento (NOVA PORTA)
    'http://localhost:3001',          // admin alternativa
  ];

  const origins = allowedOrigins.length > 0 ? allowedOrigins : defaultOrigins;

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requisições sem origin (ex: ferramentas de saúde, curl)
      if (!origin) return callback(null, true);

      // Verifica se a origem está na lista de permitidas
      const isAllowed = origins.some(allowed => {
        // Permite correspondência exata
        if (allowed === origin) return true;
        // Permite subdomínios (ex: admin.mecpro.tec.br)
        if (origin.endsWith(`.${allowed.replace('https://', '')}`)) return true;
        return false;
      });

      // Também permite localhost para desenvolvimento (qualquer porta)
      const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

      if (isAllowed || isLocalhost) {
        return callback(null, true);
      }

      // Em produção, rejeitamos origens não autorizadas
      console.warn(`❌ CORS bloqueado para origem: ${origin}`);
      callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
    },
    credentials: true, // ESSENCIAL: permite envio de cookies/cabeçalhos de autenticação
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
    ],
    optionsSuccessStatus: 200,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  // Endpoint de saúde sem prefixo /api para facilitar monitoramento
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  const port = process.env.PORT || 3000;
  const host = '0.0.0.0';

  try {
    console.log(`📡 Tentando iniciar servidor em ${host}:${port}`);
    const server = await app.listen(port, host);
    const address = server.address();

    console.log(`✅ Servidor ouvindo em http://${host}:${port}`);
    console.log(`📡 Endereço real: ${JSON.stringify(address)}`);
    console.log(
      `🚀 API rodando em ${
        process.env.APP_URL || `http://localhost:${port}`
      }`,
    );
  } catch (err) {
    console.error('❌ Falha ao iniciar servidor:', err);
    process.exit(1);
  }
}

bootstrap();