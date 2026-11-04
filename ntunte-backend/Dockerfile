# Image de base Node.js LTS
FROM node:20-alpine AS builder

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json tsconfig.json ./

# Installation des dépendances
RUN npm ci

# Copie du code source
COPY src ./src

# Compilation du code TypeScript en JavaScript
RUN npm run build

# Stage de production léger
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

# Copie des fichiers compilés depuis le builder
COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/server.js"]