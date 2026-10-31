# ─────────────────────────────────────────
# Development stage
# ─────────────────────────────────────────
FROM node:24-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY tsconfig*.json nest-cli.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY . .

EXPOSE 3030

CMD ["npm", "run", "start:dev"]

# ─────────────────────────────────────────
# Build stage
# ─────────────────────────────────────────
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ─────────────────────────────────────────
# Production stage
# ─────────────────────────────────────────
FROM node:24-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./

COPY entrypoint.prod.sh /entrypoint.sh
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads && chmod +x /entrypoint.sh
USER node

EXPOSE 3030

ENTRYPOINT ["/entrypoint.sh"]
