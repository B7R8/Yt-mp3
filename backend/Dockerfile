# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache make g++

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci --frozen-lockfile && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Temporarily rename SQLite file to avoid TypeScript compilation issues
RUN mv src/config/sqliteDatabase.ts src/config/sqliteDatabase.ts.bak

# Build the application with security optimizations
RUN npm run build

# Restore SQLite file after build
RUN mv src/config/sqliteDatabase.ts.bak src/config/sqliteDatabase.ts

# Remove source files after build (keep node_modules for production stage)
RUN rm -rf src/ package*.json tsconfig.json

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --frozen-lockfile && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create necessary directories
RUN mkdir -p downloads cache temp logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]

