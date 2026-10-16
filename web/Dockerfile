# Stage 1: Build Angular application
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies based on package lockfile
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build production artifacts
COPY . .
RUN npm run build

# Stage 2: Serve application via Nginx
FROM nginx:1.27-alpine AS runtime

# Remove default static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets to Nginx html directory
COPY --from=build /app/dist/web/browser /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

