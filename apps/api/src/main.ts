import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.setGlobalPrefix('api');

  // Configuração de CORS com log
  app.enableCors({
    origin: (origin, callback) => {
      console.log(`CORS request from origin: ${origin}`);
      // Permite qualquer origem em desenvolvimento
      callback(null, true);
    },
    credentials: true,
  });

  await app.listen(3000);
  console.log(`Backend rodando em: http://localhost:3000`);
}
bootstrap();