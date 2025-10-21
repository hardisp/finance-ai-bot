# -------------------------------
# Stage 1: Build the backend
# -------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install

# Copy full project
COPY . .

# Generate Prisma client (in builder)
RUN npx prisma generate

# Build TS
RUN npm run build


# -------------------------------
# Stage 2: Run production server
# -------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only what we need
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# ✅ run prisma migrate deploy before starting server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/index.js"]
