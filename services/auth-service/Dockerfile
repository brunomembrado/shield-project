# Multi-stage build for Auth Service
# Best Practices: 8.1 (multi-stage), 8.2 (node command), 8.5 (clean deps), 8.10 (small images)

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
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

# Set working directory
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

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production

# Set memory limit for v8 (Best Practice 8.7)
# Should be slightly less than Docker memory limit
ENV NODE_OPTIONS="--max-old-space-size=512"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start service using node command directly (Best Practice 8.2)
CMD ["node", "dist/index.js"]

