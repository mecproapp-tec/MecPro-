export function getBaseUrl(): string {
  const url = process.env.APP_URL;

  if (!url) {
    throw new Error('APP_URL não definido no .env');
  }

  return url.replace(/\/$/, ''); // remove barra final
}
