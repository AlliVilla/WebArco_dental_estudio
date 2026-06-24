FROM node:current-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

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

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npx vite build

# ─────────────────────────────────────────
# Production stage — nginx sirve el bundle
# ─────────────────────────────────────────
FROM nginx:stable-alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
