FROM node:20-bullseye AS builder

# Instalar dependências do sistema e Chromium
RUN apt-get update && apt-get install -y \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libxrandr2 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    libxshmfence1 \
    chromium \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma

# Instalar dependências (incluindo dev)
RUN npm ci

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Build do NestJS
RUN npm run build

# Copiar templates manualmente (garantir que estejam no dist)
COPY src/modules/pdf/templates dist/modules/pdf/templates/
COPY src/modules/estimates/*.hbs dist/modules/estimates/
COPY src/modules/invoices/*.hbs dist/modules/invoices/

# ---------- Estágio de produção ----------
FROM node:20-bullseye

# Instalar dependências do sistema e Chromium novamente
RUN apt-get update && apt-get install -y \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libxrandr2 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    libxshmfence1 \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Definir variável de ambiente para o Puppeteer usar o Chromium do sistema
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copiar apenas os arquivos necessários do builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Copiar templates (já copiados no builder, mas garantimos)
COPY --from=builder /app/dist/modules/pdf/templates ./dist/modules/pdf/templates
COPY --from=builder /app/dist/modules/estimates/*.hbs ./dist/modules/estimates/
COPY --from=builder /app/dist/modules/invoices/*.hbs ./dist/modules/invoices/

EXPOSE 3000

CMD ["npm", "run", "start:prod"]