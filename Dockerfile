FROM node:18-alpine AS builder
WORKDIR /app

# Copier les fichiers de dépendances depuis ntunte-web
COPY ntunte-web/package*.json ./
RUN npm install

# Copier tout le code de ntunte-web dans /app
COPY ntunte-web/ ./
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copier les dossiers nécessaires générés par le build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]