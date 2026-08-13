# --- Build stage: install deps with full npm cache available ---
FROM node:22-alpine AS deps

WORKDIR /app

# Install only what's needed to resolve dependencies first, so Docker can
# cache this layer and skip reinstalling on every code change.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# --- Runtime stage: small final image, no build tools, no dev deps ---
FROM node:22-alpine AS runtime

# Run as a non-root user inside the container — good default for anything
# exposed to the network, even in a local dev setup.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

ENV NODE_ENV=production
EXPOSE 8080

USER appuser

CMD ["node", "src/server.js"]