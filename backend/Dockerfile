# ---- Base stage ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate

# ---- Build stage ----
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS prod
WORKDIR /app
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/prisma ./prisma
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
