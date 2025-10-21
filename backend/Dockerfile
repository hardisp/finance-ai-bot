# -------------------------------
# Stage 1: Build the backend
# -------------------------------
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Install required system deps for building some npm packages (if needed)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy only package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app (including prisma schema)
COPY . .

# Generate Prisma client with correct engines for Debian
RUN npx prisma generate

# Compile TypeScript
RUN npm run build


# -------------------------------
# Stage 2: Run production server
# -------------------------------
FROM node:20-bullseye-slim AS runner

WORKDIR /app

# Install OpenSSL runtime libraries (required by Prisma)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy only needed files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

CMD ["node", "dist/src/index.js"]
