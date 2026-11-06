FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files from the ntunte-web subfolder
COPY ntunte-web/package*.json ./
RUN npm install

# Copy the rest of the web app files
COPY ntunte-web/ ./
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]"]