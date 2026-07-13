# Use a specific Node.js version for reproducible builds
FROM node:22.18-alpine

# Set working directory
WORKDIR /app

# Copy dependency files first for better Docker layer caching
COPY package*.json ./

# Install only production dependencies using package-lock.json
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Document the application port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]   