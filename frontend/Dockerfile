# ─── Stage 1: install deps ───────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps

# ─── Stage 2: build Next.js ──────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars must be present AT BUILD TIME
# They are baked into the JS bundle — not runtime env vars
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_SOCKET_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ─── Stage 3: production image ───────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache curl

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
# public/ folder is optional — copy only if it exists
COPY --from=builder /app/public* ./public/
COPY package.json ./
COPY next.config.ts ./

EXPOSE 3000
CMD ["npm", "start"]
