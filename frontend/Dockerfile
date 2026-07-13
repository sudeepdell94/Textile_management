# ==========================
# Stage 1 - Build React App
# ==========================
FROM node:22.18-alpine AS build

WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build production assets
RUN npm run build

# ==========================
# Stage 2 - Nginx
# ==========================
FROM nginx:1.28-alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Document exposed port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]