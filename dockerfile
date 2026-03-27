FROM mcr.microsoft.com/playwright:v1.55.0-noble

WORKDIR /app

# Instala dependências adicionais do sistema
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Copia os arquivos do projeto
COPY package*.json ./
RUN npm install

COPY . .

# Instala os browsers do Playwright
RUN npx playwright install --with-deps chromium

EXPOSE 3001

CMD ["node", "server.js"]