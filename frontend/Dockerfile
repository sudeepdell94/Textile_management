# ==========================
# Stage 1 - Build React App
# ==========================
FROM node:22.18-alpine AS build

WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Clean npm cache and remove lock file to trigger fresh install
RUN rm -rf node_modules package-lock.json && npm cache clean --force

# Install dependencies fresh
RUN npm install

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
