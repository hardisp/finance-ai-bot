# Makefile for FinanceAI

DOCKER_COMPOSE = docker compose

# --- Core Commands ---

# Start all containers
up:
	$(DOCKER_COMPOSE) up -d

# Stop all containers
down:
	$(DOCKER_COMPOSE) down

# Build all containers (no cache)
rebuild:
	$(DOCKER_COMPOSE) build --no-cache

# Build all containers (with cache)
build:
	$(DOCKER_COMPOSE) build

# View logs (follow mode)
logs:
	$(DOCKER_COMPOSE) logs -f

# --- Database Operations ---

# Run Prisma migrations
migrate:
	$(DOCKER_COMPOSE) exec backend npx prisma migrate deploy

# Run Prisma seed
seed:
	$(DOCKER_COMPOSE) exec backend npx ts-node prisma/seed.ts

# Reset database (dangerous)
reset:
	$(DOCKER_COMPOSE) exec backend npx prisma migrate reset --force

# --- Development Utilities ---

# Rebuild and restart everything
restart:
	make down
	make build
	make up

# Tail backend logs
be-logs:
	$(DOCKER_COMPOSE) logs -f backend

# Tail frontend logs
fe-logs:
	$(DOCKER_COMPOSE) logs -f frontend

# Open backend shell
be-sh:
	$(DOCKER_COMPOSE) exec backend sh

# Open frontend shell
fe-sh:
	$(DOCKER_COMPOSE) exec frontend sh
