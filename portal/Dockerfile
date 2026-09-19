FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero para aprovechar la caché de capas
COPY portal/package*.json ./portal/
RUN cd /app/portal && npm ci --omit=dev

# Copiar todo el repositorio (portal + scripts + configs)
COPY . /app

WORKDIR /app/portal

ENV NODE_ENV=production \
    PORT=3000 \
    NEUBAT_DATA_DIR=/app/data \
    NEUBAT_CONFIGS_DIR=/app/portal/configs/generated

EXPOSE 3000

VOLUME ["/app/data", "/app/portal/configs/generated"]

CMD ["node", "server.js"]
