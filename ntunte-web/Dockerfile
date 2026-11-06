FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files from the current directory
COPY package*.json ./
RUN npm install

# Copy the rest of the application files
COPY . ./
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]