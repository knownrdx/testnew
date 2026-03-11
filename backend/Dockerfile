# ─── Stage 1: install all deps ───────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
ENV NODE_ENV=development
COPY package.json ./
RUN npm install --legacy-peer-deps

# ─── Stage 2: build TypeScript ───────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ─── Stage 3: production image ───────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy production deps
COPY package.json ./
RUN npm install --legacy-peer-deps --omit=dev

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Copy Prisma client (generated) and schema
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY prisma ./prisma

EXPOSE 4000

# Auto-migrate DB then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
