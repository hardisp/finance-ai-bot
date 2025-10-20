# backend/Dockerfile

FROM node:20-alpine AS base

# Install system tools and OpenSSL 1.1 compatibility libs (needed by Prisma)
RUN apk add --no-cache python3 make g++ bash openssl1.1-compat

# Set working directory
WORKDIR /app

# Copy package files first (for caching npm installs)
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install --silent

# Copy the rest of the source code
COPY . .

# Ensure local binaries like `tsx` and `prisma` are in PATH
ENV PATH="./node_modules/.bin:$PATH"

# Expose backend port
EXPOSE 4000

# Default command: run in watch/dev mode
CMD ["npx", "tsx", "watch", "src/index.ts"]
