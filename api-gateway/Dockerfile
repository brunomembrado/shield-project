# Multi-stage build for API Gateway
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist

EXPOSE 8080
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]

