# syntax=docker/dockerfile:1.6

# --- Stage 1: install production deps ---------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund

# --- Stage 2: runtime -------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3001

# Non-root user
RUN addgroup -S app && adduser -S app -G app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY src ./src
COPY scripts ./scripts

# Writable directory for the on-disk ledger / tasks / users / providers.
RUN mkdir -p src/data && chown -R app:app /app

USER app

EXPOSE 3001

# Healthcheck hits the readiness endpoint so the container is marked
# unhealthy when any dependency is down.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/api/ready || exit 1

CMD ["node", "src/server.js"]
