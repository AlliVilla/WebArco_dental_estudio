FROM node:current-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install && npm cache clean --force

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig*.json nest-cli.json ./

FROM base AS development

COPY . .

EXPOSE 3030

CMD ["npm", "run", "start:dev"]

FROM base AS build

COPY . .
RUN npm run build

FROM node:current-alpine AS production

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

EXPOSE 3030

CMD ["node", "dist/main"]
