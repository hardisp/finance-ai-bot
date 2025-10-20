# frontend/Dockerfile

# Use lightweight Alpine-based Node image
FROM node:20-alpine AS base

# Initialize package index first, then install build tools
RUN apk update && apk add --no-cache python3 make g++ bash

# Set working directory
WORKDIR /app

# Copy package files first (for caching efficiency)
COPY package*.json ./

# Install dependencies inside container
RUN npm install --silent

# Copy the rest of the source code
COPY . .

# Expose frontend port
EXPOSE 3000

# Build production bundle
RUN npm run build

# Default command (can be overridden by docker-compose)
CMD ["npm", "run", "start"]
