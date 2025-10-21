# -------------------------------
# Stage 1: Build the backend
# -------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app (including prisma schema)
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript
RUN npm run build


# -------------------------------
# Stage 2: Run production server
# -------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only needed files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose port for Render
EXPOSE 4000

# Environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Generate Prisma client again (ensures schema exists in runtime container)
RUN npx prisma generate

# Start the server
CMD ["node", "dist/server.js"]
