# Use official Node image as base
FROM node:22-alpine

# Set working directory inside container
WORKDIR /app

# Copy only package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of your backend source code
COPY . .

# Expose backend port (adjust if different)
EXPOSE 5000

# Set environment variable (optional)
ENV NODE_ENV=production

# Start backend
CMD ["node", "server.js"]
