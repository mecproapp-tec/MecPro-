# ---------- Estágio 1: Builder ----------
FROM node:20-bullseye AS builder

# Instalar dependências do sistema para o Puppeteer
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
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma

# Instalar todas as dependências (incluindo dev)
RUN npm ci

# Gerar Prisma Client (usando o executável local)
RUN npx prisma generate

# Copiar o código fonte e construir
COPY . .
RUN npm run build

# Copiar templates manualmente (garantir que estejam no dist)
COPY src/modules/pdf/templates dist/modules/pdf/templates/
COPY src/modules/estimates/*.hbs dist/modules/estimates/
COPY src/modules/invoices/*.hbs dist/modules/invoices/

# ---------- Estágio 2: Produção ----------
FROM node:20-bullseye

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
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar apenas os arquivos necessários do builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Copiar também os templates (caso não tenham sido copiados pelo build)
# (Já foram copiados no builder, mas garantimos novamente)
COPY --from=builder /app/dist/modules/pdf/templates ./dist/modules/pdf/templates
COPY --from=builder /app/dist/modules/estimates/*.hbs ./dist/modules/estimates/
COPY --from=builder /app/dist/modules/invoices/*.hbs ./dist/modules/invoices/

EXPOSE 3000

CMD ["npm", "run", "start:prod"]