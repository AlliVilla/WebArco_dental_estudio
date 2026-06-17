FROM node:current-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY tsconfig*.json nest-cli.json ./

FROM base AS development

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 3030

CMD ["npm", "run", "start:dev"]

FROM node:current-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY . .
RUN npm run build

FROM node:current-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma

COPY entrypoint.prod.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3030

ENTRYPOINT ["/entrypoint.sh"]
