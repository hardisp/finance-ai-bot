# backend/Dockerfile

FROM node:20-alpine AS base

# Install system tools and OpenSSL (for Prisma engine)
RUN apk add --no-cache python3 make g++ bash openssl

# Set working directory
WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm install --silent

# Copy rest of the source code
COPY . .

# Ensure node_modules/.bin is in PATH
ENV PATH="./node_modules/.bin:$PATH"

# Expose backend port
EXPOSE 4000

# Run in dev mode with tsx
CMD ["npx", "tsx", "watch", "src/index.ts"]
