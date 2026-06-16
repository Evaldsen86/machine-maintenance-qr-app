#
# Frontend Dockerfile (skeleton)
# --------------------------------
# This builds the Vite React app and serves the compiled static files.
#
# Note: this assumes Vite build output goes to `dist/` (default).
# No frontend business logic is changed.
#

FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine AS runtime

COPY --from=build /app/dist/ /usr/share/nginx/html/

# Nginx already provides a SPA-friendly default config in this image,
# but our docker/nginx.conf is mounted by docker-compose.

EXPOSE 80

