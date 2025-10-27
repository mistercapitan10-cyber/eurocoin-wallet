# syntax=docker/dockerfile:1.6

FROM node:20-alpine AS base
ENV NODE_ENV=production
ENV npm_config_legacy_peer_deps=true

RUN apk add --no-cache python3 make g++
WORKDIR /app

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci --omit=dev
COPY next.config.ts ./next.config.ts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY docker/scripts ./docker/scripts
RUN chmod +x ./docker/scripts/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker/scripts/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
