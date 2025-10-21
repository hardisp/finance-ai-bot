# =========================
# 1️⃣ Build Stage
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk update && apk add --no-cache python3 make g++ bash

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# =========================
# 2️⃣ Run Stage (Production)
# =========================
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next

# Only copy /public if it exists → currently your app has none
# COPY --from=builder /app/public ./public

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start"]
