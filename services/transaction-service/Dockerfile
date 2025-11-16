# Multi-stage build for Transaction Service
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci && npm cache clean --force
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3003
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]

