FROM node:current-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install && npm cache clean --force

COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./

# ─────────────────────────────────────────
# Development stage — Vite dev server (HMR)
# ─────────────────────────────────────────
FROM base AS development

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ─────────────────────────────────────────
# Build stage
# ─────────────────────────────────────────
FROM base AS build

COPY . .
RUN npm run build

# ─────────────────────────────────────────
# Production stage — nginx sirve el bundle
# ─────────────────────────────────────────
FROM nginx:stable-alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
