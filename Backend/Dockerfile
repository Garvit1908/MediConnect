# Multi-stage production Dockerfile for MediConnect Backend API
FROM node:20-alpine AS builder

WORKDIR /app

# Install native compilation dependencies for packages like bcrypt
RUN apk add --no-cache python3 make g++

COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev --no-audit

# ----------------------------------------------------
# Production Runner Stage
# ----------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Install curl for container health monitoring
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=4000

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Set container permissions for non-root user
RUN chown -R node:node /app

USER node

EXPOSE 4000

# Health Check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/v1/health || exit 1

CMD ["node", "index.js"]