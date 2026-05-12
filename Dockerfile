# ── Stage 1: deps ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ── Stage 2: builder ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ARG API_URL=http://api-cpp:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_URL=$API_URL
RUN npm run build

# ── Stage 3: production ───────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs \
 && mkdir -p .next/cache && chown -R nextjs:nextjs .next
USER nextjs

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]

# ── Stage 4: development ──────────────────────────────────────
FROM deps AS development
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
