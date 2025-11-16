# Multi-stage build for Blockchain Service
# Best Practices: 8.1 (multi-stage), 8.2 (node command), 8.5 (clean deps), 8.10 (small images)

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching (Best Practice 8.8)
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including dev) for building
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine

# Create non-root user (Best Practice 6.13)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files and prisma schema BEFORE npm ci
COPY package*.json ./
COPY --from=builder /app/prisma ./prisma

# Install production dependencies only (will run prisma generate via postinstall)
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3004

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]

