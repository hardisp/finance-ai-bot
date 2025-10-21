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

# Create simple postgres wait script
RUN echo '#!/bin/sh\n\
echo "⏳ Waiting for database..."\n\
until nc -z "${DB_HOST:-db}" "${DB_PORT:-5432}"; do\n\
  sleep 1\n\
done\n\
echo "✅ Database is up!"\n\
exec "$@"' > /wait-for-db.sh \
 && chmod +x /wait-for-db.sh

EXPOSE 4000

# Environment variables
ENV NODE_ENV=production
ENV PORT=4000

# ✅ correct entry
CMD ["/wait-for-db.sh", "node", "dist/src/index.js"]
