FROM node:22-alpine

WORKDIR /app

# Copia apenas os manifests primeiro (cache de layers)
COPY package*.json ./

# Instala dependências de produção (--ignore-scripts pois sql.js é WASM puro)
RUN npm ci --omit=dev --ignore-scripts

# Copia o código fonte
COPY src/ ./src/

# Diretórios de dados e logs
RUN mkdir -p /app/data /app/logs

# Usuário não-root
RUN addgroup -S veritas && adduser -S veritas -G veritas && \
    chown -R veritas:veritas /app
USER veritas

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
