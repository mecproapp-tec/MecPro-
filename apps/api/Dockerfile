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

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build

# Copiar templates manualmente
COPY src/modules/pdf/templates dist/modules/pdf/templates/
COPY src/modules/estimates/*.hbs dist/modules/estimates/
COPY src/modules/invoices/*.hbs dist/modules/invoices/

# ---------- Estágio de produção ----------
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
    chromium \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

COPY --from=builder /app/dist/modules/pdf/templates ./dist/modules/pdf/templates
COPY --from=builder /app/dist/modules/estimates/*.hbs ./dist/modules/estimates/
COPY --from=builder /app/dist/modules/invoices/*.hbs ./dist/modules/invoices/

EXPOSE 3000

CMD ["npm", "run", "start:prod"]