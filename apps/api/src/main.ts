async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('🔥 SUBIU A API CORRETA 🔥');

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT || 3000);
}