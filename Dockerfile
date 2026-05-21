# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

# Build tools are required to compile better-sqlite3 from source.
# They are only installed in this stage and never reach the final image.
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package manifests first for better layer caching
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm ci

COPY . .

RUN npm run build

# Remove devDependencies so the pruned node_modules can be copied to the runner
RUN npm prune --omit=dev

# ── Stage 2: production ──────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Runtime dependencies (hoisted to root by npm workspaces)
COPY --from=builder /app/node_modules ./node_modules
# Any non-hoisted server deps
COPY --from=builder /app/server/node_modules ./server/node_modules

# Compiled output
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# JSON seed files are read at runtime by the seed script
COPY --from=builder /app/server/src/db/seeds ./server/src/db/seeds

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
