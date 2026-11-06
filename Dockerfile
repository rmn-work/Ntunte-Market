FROM node:18-alpine AS builder
WORKDIR /app

# Copier les fichiers de dépendances
COPY ntunte-web/package*.json ./
RUN npm install

# Copier le code source de ntunte-web
COPY ntunte-web/ ./

# S'assurer que le dossier public existe (création automatique s'il est absent)
RUN mkdir -p public

RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copier les éléments générés
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]