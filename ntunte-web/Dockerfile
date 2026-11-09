# 1. Construction
FROM node:18-alpine AS builder
WORKDIR /app
COPY ntunte-web/package*.json ./
RUN npm install
COPY ntunte-web/ ./
RUN npm run build

# 2. Exécution
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 10000
ENV PORT=10000

CMD ["node", "server.js"]