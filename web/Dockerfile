# Stage 1: Build Angular application
FROM node:24-alpine AS build
WORKDIR /app

# Install dependencies based on package lockfile
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build production artifacts
COPY . .
RUN npm run build

# Stage 2: Serve application via Nginx
FROM nginx:1.30.5-alpine AS runtime

# Remove default static files
RUN apk add --no-cache jq && rm -rf /usr/share/nginx/html/*

# Copy built assets to Nginx html directory
COPY --from=build /app/dist/web/browser /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

